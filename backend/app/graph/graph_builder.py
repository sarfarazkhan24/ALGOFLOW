"""
Control-Flow Graph (CFG) Generator for AlgoFlow.
Converts classified statements into a connected directed graph,
handling sequential execution, decision true/false branching,
branch reconvergence (merging), loop bodies, back-edges, and loop exits.
"""
from typing import List, Dict, Any, Tuple, Optional
import networkx as nx
from ..models.schema import (
    StatementAnalysis,
    FlowNode,
    FlowEdge,
    ValidationResult,
    ValidationIssue,
)
from ..nlp.condition_parser import extract_if_condition_and_branches, extract_loop_condition


def format_node_label(stmt: StatementAnalysis) -> str:
    """Produces clean, standardized flowchart labels for node symbols."""
    stype = stmt.statement_type
    text = stmt.cleaned_text

    if stype == "start":
        return "Start"
    elif stype == "end":
        return "End"
    elif stype == "decision":
        cond = stmt.condition_expr or text
        cond = cond.rstrip("?:")
        return f"{cond}?" if not cond.endswith("?") else cond
    elif stype == "loop":
        cond = stmt.condition_expr or text
        return f"While {cond}" if not cond.lower().startswith("while") else cond
    elif stype == "input":
        # E.g. "Read two numbers, A and B" -> "Read A, B"
        if stmt.variables:
            return f"Read {', '.join(stmt.variables)}"
        return text
    elif stype == "output":
        if text.lower().startswith("print ") or text.lower().startswith("display "):
            return text
        return f"Print {text}"
    elif stype == "process":
        return text
    return text


class CFGBuilder:
    def __init__(self, statements: List[StatementAnalysis]):
        self.statements = statements
        self.nodes: List[FlowNode] = []
        self.edges: List[FlowEdge] = []
        self.node_id_counter = 0
        self.edge_id_counter = 0

    def next_node_id(self, prefix: str = "node") -> str:
        self.node_id_counter += 1
        return f"{prefix}_{self.node_id_counter}"

    def next_edge_id(self) -> str:
        self.edge_id_counter += 1
        return f"edge_{self.edge_id_counter}"

    def build(self) -> Tuple[List[FlowNode], List[FlowEdge]]:
        """Constructs flowchart nodes and edges following control-flow logic."""
        if not self.statements:
            return [], []

        # Step 1: Detect explicit Start or prepend Start if missing
        has_explicit_start = any(s.statement_type == "start" for s in self.statements)
        has_explicit_end = any(s.statement_type == "end" for s in self.statements)

        stmts = list(self.statements)
        synthetic_start = False
        synthetic_end = False

        if not has_explicit_start:
            # Create synthetic start
            synthetic_start = True

        if not has_explicit_end:
            synthetic_end = True

        # Process statements and identify compound if/loop constructs
        # We will parse the stream and connect blocks
        i = 0
        previous_tails: List[str] = []  # Nodes that need to connect to the next block

        # Add Start node
        start_node_id = self.next_node_id("start")
        start_label = "Start"
        start_orig = stmts[0].original_text if stmts else "Start"
        if has_explicit_start and stmts[0].statement_type == "start":
            start_orig = stmts[0].original_text
            i = 1  # Skip the first statement as start node
        self.nodes.append(
            FlowNode(
                id=start_node_id,
                type="start",
                label=start_label,
                original_text=start_orig,
                statement_index=0 if not synthetic_start else -1,
                confidence=1.0,
            )
        )
        previous_tails.append(start_node_id)

        while i < len(stmts):
            stmt = stmts[i]

            # If it's an end statement, handle termination
            if stmt.statement_type == "end":
                end_node_id = self.next_node_id("end")
                self.nodes.append(
                    FlowNode(
                        id=end_node_id,
                        type="end",
                        label="End",
                        original_text=stmt.original_text,
                        statement_index=stmt.index,
                        confidence=stmt.confidence,
                    )
                )
                for tail in previous_tails:
                    self.edges.append(FlowEdge(id=self.next_edge_id(), source=tail, target=end_node_id))
                previous_tails = []
                i += 1
                continue

            # Check if this statement is a compound Decision (e.g. "If A > B, print A; otherwise, print B")
            cond_expr, true_action, false_action = extract_if_condition_and_branches(stmt.cleaned_text)
            is_compound_if = cond_expr is not None and true_action is not None

            # Or check if next statement is an "otherwise" / "else" statement
            has_separate_else = (
                i + 1 < len(stmts)
                and (
                    stmts[i + 1].statement_type == "decision"
                    or stmts[i + 1].branch_type == "false_branch"
                    or stmts[i + 1].cleaned_text.lower().startswith("otherwise")
                    or stmts[i + 1].cleaned_text.lower().startswith("else")
                )
            )

            if stmt.statement_type == "decision" or is_compound_if:
                # Build Decision node
                dec_node_id = self.next_node_id("dec")
                dec_label = f"{cond_expr or stmt.condition_expr or stmt.cleaned_text}?"
                dec_label = dec_label.replace("??", "?")
                self.nodes.append(
                    FlowNode(
                        id=dec_node_id,
                        type="decision",
                        label=dec_label,
                        original_text=stmt.original_text,
                        statement_index=stmt.index,
                        condition=cond_expr or stmt.condition_expr,
                        variables=stmt.variables,
                        confidence=stmt.confidence,
                    )
                )
                for tail in previous_tails:
                    self.edges.append(FlowEdge(id=self.next_edge_id(), source=tail, target=dec_node_id))
                previous_tails = []

                # True branch node
                true_label = true_action if true_action else "Process (True)"
                true_node_id = self.next_node_id("true_branch")
                # Determine type of true branch
                true_type = "output" if any(w in true_label.lower() for w in ["print", "display", "output"]) else "process"
                self.nodes.append(
                    FlowNode(
                        id=true_node_id,
                        type=true_type,
                        label=true_label,
                        original_text=stmt.original_text,
                        statement_index=stmt.index,
                        confidence=stmt.confidence,
                    )
                )
                self.edges.append(
                    FlowEdge(id=self.next_edge_id(), source=dec_node_id, target=true_node_id, label="True")
                )

                # False branch node
                false_node_id = None
                if false_action:
                    # In compound sentence: "otherwise, print B"
                    false_label = false_action
                    false_node_id = self.next_node_id("false_branch")
                    false_type = "output" if any(w in false_label.lower() for w in ["print", "display", "output"]) else "process"
                    self.nodes.append(
                        FlowNode(
                            id=false_node_id,
                            type=false_type,
                            label=false_label,
                            original_text=stmt.original_text,
                            statement_index=stmt.index,
                            confidence=stmt.confidence,
                        )
                    )
                    self.edges.append(
                        FlowEdge(id=self.next_edge_id(), source=dec_node_id, target=false_node_id, label="False")
                    )
                elif has_separate_else:
                    # False branch is in subsequent statement
                    else_stmt = stmts[i + 1]
                    false_label = else_stmt.cleaned_text
                    false_node_id = self.next_node_id("false_branch")
                    self.nodes.append(
                        FlowNode(
                            id=false_node_id,
                            type=else_stmt.statement_type if else_stmt.statement_type not in ["decision", "ambiguous"] else "process",
                            label=false_label,
                            original_text=else_stmt.original_text,
                            statement_index=else_stmt.index,
                            confidence=else_stmt.confidence,
                        )
                    )
                    self.edges.append(
                        FlowEdge(id=self.next_edge_id(), source=dec_node_id, target=false_node_id, label="False")
                    )
                    i += 1  # Consumed the else statement
                else:
                    # One-way decision (no false branch statement), false branch will bypass to next statement
                    pass

                # Next statement will connect from True node and False node (or bypass from decision)
                if false_node_id:
                    previous_tails = [true_node_id, false_node_id]
                else:
                    previous_tails = [true_node_id, dec_node_id]  # dec_node_id connects as False to next statement
                i += 1
                continue

            # Check if this statement is a Loop
            if stmt.statement_type == "loop":
                loop_node_id = self.next_node_id("loop")
                loop_label = format_node_label(stmt)
                self.nodes.append(
                    FlowNode(
                        id=loop_node_id,
                        type="loop",
                        label=loop_label,
                        original_text=stmt.original_text,
                        statement_index=stmt.index,
                        condition=stmt.condition_expr,
                        variables=stmt.variables,
                        confidence=stmt.confidence,
                    )
                )
                for tail in previous_tails:
                    self.edges.append(FlowEdge(id=self.next_edge_id(), source=tail, target=loop_node_id))
                previous_tails = []

                # Look for body of the loop
                # Case 1: Body is inside the same statement (e.g., "Repeat while i <= N: add i to sum, increment i by 1")
                loop_cond, loop_body, _ = extract_loop_condition(stmt.cleaned_text)
                body_node_ids: List[str] = []
                if loop_body:
                    # Body actions separated by commas or 'and'
                    sub_actions = [a.strip() for a in loop_body.split(",") if a.strip()]
                    last_b = loop_node_id
                    for s_idx, action in enumerate(sub_actions):
                        b_node_id = self.next_node_id("loop_body")
                        body_node_ids.append(b_node_id)
                        b_type = "output" if any(w in action.lower() for w in ["print", "display"]) else "process"
                        self.nodes.append(
                            FlowNode(
                                id=b_node_id,
                                type=b_type,
                                label=action,
                                original_text=stmt.original_text,
                                statement_index=stmt.index,
                                confidence=0.90,
                            )
                        )
                        edge_label = "Loop" if s_idx == 0 else None
                        self.edges.append(
                            FlowEdge(id=self.next_edge_id(), source=last_b, target=b_node_id, label=edge_label)
                        )
                        last_b = b_node_id
                    # Loop back-edge from last body node to loop condition
                    self.edges.append(
                        FlowEdge(
                            id=self.next_edge_id(),
                            source=last_b,
                            target=loop_node_id,
                            label="Repeat",
                            edge_type="backedge",
                        )
                    )
                else:
                    # Check if next statements form the loop body (e.g. numbered steps until End Loop or next unindented step)
                    # Peek ahead for statements that modify variables in the condition
                    body_stmts = []
                    j = i + 1
                    while j < len(stmts):
                        next_s = stmts[j]
                        if next_s.statement_type in ["end", "start"]:
                            break
                        if next_s.cleaned_text.lower().startswith("end loop") or next_s.cleaned_text.lower().startswith("repeat"):
                            break
                        # If output or final statement, could be after loop
                        if next_s.statement_type == "output" and j == len(stmts) - 2:
                            # Likely the output after loop
                            break
                        body_stmts.append(next_s)
                        j += 1
                        if len(body_stmts) >= 2:  # typically 1-2 body statements
                            break

                    if body_stmts:
                        last_b = loop_node_id
                        for s_idx, b_s in enumerate(body_stmts):
                            b_node_id = self.next_node_id("loop_body")
                            body_node_ids.append(b_node_id)
                            self.nodes.append(
                                FlowNode(
                                    id=b_node_id,
                                    type=b_s.statement_type,
                                    label=format_node_label(b_s),
                                    original_text=b_s.original_text,
                                    statement_index=b_s.index,
                                    variables=b_s.variables,
                                    confidence=b_s.confidence,
                                )
                            )
                            edge_label = "Loop" if s_idx == 0 else None
                            self.edges.append(
                                FlowEdge(id=self.next_edge_id(), source=last_b, target=b_node_id, label=edge_label)
                            )
                            last_b = b_node_id
                        # Loop back-edge
                        self.edges.append(
                            FlowEdge(
                                id=self.next_edge_id(),
                                source=last_b,
                                target=loop_node_id,
                                label="Repeat",
                                edge_type="backedge",
                            )
                        )
                        i = j - 1  # Advance index past loop body

                # The loop condition node exits to the next statement when condition is False
                previous_tails = [loop_node_id]  # Will connect with label "Exit" / "False"
                i += 1
                continue

            # Standard Sequential Node (Input, Output, Process, Ambiguous)
            node_id = self.next_node_id(stmt.statement_type)
            node_label = format_node_label(stmt)
            self.nodes.append(
                FlowNode(
                    id=node_id,
                    type=stmt.statement_type,
                    label=node_label,
                    original_text=stmt.original_text,
                    statement_index=stmt.index,
                    variables=stmt.variables,
                    confidence=stmt.confidence,
                )
            )

            # Connect previous tails to this node
            for tail in previous_tails:
                # Check if tail was a loop condition node or decision node
                tail_node = next((n for n in self.nodes if n.id == tail), None)
                lbl = None
                if tail_node and tail_node.type == "loop":
                    lbl = "Exit"
                elif tail_node and tail_node.type == "decision":
                    lbl = "False"
                self.edges.append(FlowEdge(id=self.next_edge_id(), source=tail, target=node_id, label=lbl))

            previous_tails = [node_id]
            i += 1

        # If previous_tails still has nodes, connect to End node
        if previous_tails:
            end_node_id = self.next_node_id("end")
            self.nodes.append(
                FlowNode(
                    id=end_node_id,
                    type="end",
                    label="End",
                    original_text="End",
                    statement_index=len(stmts),
                    confidence=1.0,
                )
            )
            for tail in previous_tails:
                tail_node = next((n for n in self.nodes if n.id == tail), None)
                lbl = None
                if tail_node and tail_node.type == "loop":
                    lbl = "Exit"
                elif tail_node and tail_node.type == "decision":
                    lbl = "False"
                self.edges.append(FlowEdge(id=self.next_edge_id(), source=tail, target=end_node_id, label=lbl))

        return self.nodes, self.edges

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Header from './components/Header';
import EditorPanel from './components/EditorPanel';
import ValidationPanel from './components/ValidationPanel';
import NodeDetailDrawer from './components/NodeDetailDrawer';
import NLPInspectorModal from './components/NLPInspectorModal';
import IRViewerModal from './components/IRViewerModal';
import ImagePreviewModal from './components/ImagePreviewModal';

import TerminatorNode from './components/nodes/TerminatorNode';
import InputOutputNode from './components/nodes/InputOutputNode';
import ProcessNode from './components/nodes/ProcessNode';
import DecisionNode from './components/nodes/DecisionNode';
import LoopNode from './components/nodes/LoopNode';
import AmbiguousNode from './components/nodes/AmbiguousNode';
import CustomFlowEdge from './components/edges/CustomFlowEdge';

import { getLayoutedElements } from './utils/layout';
import { exportFlowchartToPng, exportFlowchartToSvg, downloadJsonIR } from './utils/export';
import { Sparkles, Maximize2, ShieldAlert, Cpu } from 'lucide-react';

const nodeTypes = {
  start: TerminatorNode,
  end: TerminatorNode,
  input: InputOutputNode,
  output: InputOutputNode,
  process: ProcessNode,
  decision: DecisionNode,
  loop: LoopNode,
  ambiguous: AmbiguousNode,
};

const edgeTypes = {
  default: CustomFlowEdge,
};

const DEFAULT_ALGORITHM = `Start.
Read a number.
If it is even, print Even; otherwise, print Odd.
End.`;

function FlowchartCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  selectedNode,
  onCloseDrawer,
  onUpdateNodeLabel,
  direction,
  onRelayout,
  onOpenNLP,
  validation,
  onSelectNode,
  onSelectStatement,
}) {
  const { fitView } = useReactFlow();

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.25, duration: 400 });
  }, [fitView]);

  return (
    <div className="relative flex-1 h-full w-full bg-[#080b12] overflow-hidden">
      {/* React Flow Viewport */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          nodeColor={(n) => {
            if (n.data?.type === 'start') return '#10b981';
            if (n.data?.type === 'end') return '#f43f5e';
            if (n.data?.type === 'decision') return '#f59e0b';
            if (n.data?.type === 'loop') return '#a855f7';
            if (n.data?.type === 'input' || n.data?.type === 'output') return '#06b6d4';
            return '#6366f1';
          }}
          maskColor="rgba(11, 15, 25, 0.75)"
          className="!hidden sm:!block"
        />
      </ReactFlow>

      {/* Floating Canvas Action Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={onRelayout}
          className="px-3 py-1.5 rounded-lg glass-panel bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 shadow-lg cursor-pointer transition-colors"
        >
          <Maximize2 size={13} className="text-cyan-400" />
          <span>Auto-Layout</span>
        </button>

        <button
          onClick={onOpenNLP}
          className="px-3 py-1.5 rounded-lg glass-panel bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 shadow-lg cursor-pointer transition-colors"
        >
          <Cpu size={13} className="text-indigo-400" />
          <span>Linguistic Pipeline (NLP)</span>
        </button>
      </div>

      {/* Bottom Floating Validation Warnings Card (collapsible / compact) */}
      {validation && (validation.errors_count > 0 || validation.warnings_count > 0) && (
        <div className="absolute bottom-4 left-16 z-20 max-w-md hidden md:block">
          <ValidationPanel
            validation={validation}
            onSelectNode={onSelectNode}
            onSelectStatement={onSelectStatement}
          />
        </div>
      )}

      {/* Node Inspector Drawer */}
      <NodeDetailDrawer
        selectedNode={selectedNode}
        onClose={onCloseDrawer}
        onUpdateNodeLabel={onUpdateNodeLabel}
      />
    </div>
  );
}

export default function App() {
  const [inputText, setInputText] = useState(DEFAULT_ALGORITHM);
  const [isLoading, setIsLoading] = useState(false);
  const [examples, setExamples] = useState([]);
  const [selectedExampleId, setSelectedExampleId] = useState('even-odd');

  const [irData, setIrData] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [direction, setDirection] = useState('TB');

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedStatementIndex, setSelectedStatementIndex] = useState(null);

  const [isNlpModalOpen, setIsNlpModalOpen] = useState(false);
  const [isIrModalOpen, setIsIrModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    dataUrl: '',
    format: 'png',
    filename: 'algoflow-diagram.png',
  });

  // Load sample algorithms from backend
  useEffect(() => {
    fetch('/api/examples')
      .then((res) => res.json())
      .then((data) => {
        setExamples(data);
      })
      .catch((err) => {
        console.error('Failed to load examples:', err);
      });
  }, []);

  // Analyze algorithm and layout graph
  const handleAnalyze = useCallback(
    async (textToAnalyze = inputText) => {
      if (!textToAnalyze.trim()) return;
      setIsLoading(true);
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToAnalyze }),
        });

        if (!response.ok) {
          const errData = await response.json();
          alert(`Analysis Error: ${errData.detail || 'Unable to analyze algorithm'}`);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setIrData(data);

        // Convert IR nodes to React Flow nodes
        const rawFlowNodes = data.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          data: {
            ...n,
            label: n.label,
            type: n.type,
          },
          position: { x: 0, y: 0 },
        }));

        // Convert IR edges to React Flow edges with colored badges
        const rawFlowEdges = data.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          type: 'default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color:
              e.label === 'True'
                ? '#10b981'
                : e.label === 'False'
                ? '#f43f5e'
                : e.label === 'Loop' || e.edge_type === 'backedge'
                ? '#a855f7'
                : '#64748b',
          },
          data: {
            edge_type: e.edge_type,
          },
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          rawFlowNodes,
          rawFlowEdges,
          direction
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        setSelectedNodeId(null);
        setSelectedStatementIndex(null);
      } catch (error) {
        console.error('API analyze error:', error);
        alert('Failed to connect to AlgoFlow backend. Please check if server is running.');
      } finally {
        setIsLoading(false);
      }
    },
    [inputText, direction, setNodes, setEdges]
  );

  // Initial analysis on load
  useEffect(() => {
    handleAnalyze(DEFAULT_ALGORITHM);
  }, []);

  // Handle example selection
  const handleSelectExample = (id) => {
    setSelectedExampleId(id);
    const ex = examples.find((e) => e.id === id);
    if (ex) {
      setInputText(ex.text);
      handleAnalyze(ex.text);
    }
  };

  // Re-layout existing graph elements
  const handleRelayout = useCallback(() => {
    if (nodes.length === 0) return;
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      direction
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, direction, setNodes, setEdges]);

  // Toggle layout direction (TB vs LR)
  const handleToggleDirection = () => {
    const nextDir = direction === 'TB' ? 'LR' : 'TB';
    setDirection(nextDir);
    if (nodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        nextDir
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    }
  };

  // Node Click: Highlight in diagram and synchronize statement
  const handleNodeClick = useCallback(
    (_, node) => {
      setSelectedNodeId(node.id);
      if (node.data?.statement_index !== undefined && node.data.statement_index >= 0) {
        setSelectedStatementIndex(node.data.statement_index);
      }
    },
    []
  );

  // Statement Click in editor: select corresponding node
  const handleSelectStatement = useCallback(
    (stmtIndex) => {
      setSelectedStatementIndex(stmtIndex);
      const targetNode = nodes.find((n) => n.data?.statement_index === stmtIndex);
      if (targetNode) {
        setSelectedNodeId(targetNode.id);
      }
    },
    [nodes]
  );

  // Update Node Label inline
  const handleUpdateNodeLabel = useCallback(
    (nodeId, newLabel) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                label: newLabel,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Find currently selected node
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Node selection styling in React Flow
  const styledNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      selected: node.id === selectedNodeId,
    }));
  }, [nodes, selectedNodeId]);

  // Exports
  const handleExportPng = async () => {
    try {
      const dataUrl = await exportFlowchartToPng(nodes, 'algoflow-diagram.png');
      if (dataUrl) {
        setPreviewModal({
          isOpen: true,
          dataUrl,
          format: 'png',
          filename: 'algoflow-diagram.png',
        });
      }
    } catch (err) {
      console.error('Export PNG failed:', err);
    }
  };

  const handleExportSvg = async () => {
    try {
      const dataUrl = await exportFlowchartToSvg(nodes, 'algoflow-diagram.svg');
      if (dataUrl) {
        setPreviewModal({
          isOpen: true,
          dataUrl,
          format: 'svg',
          filename: 'algoflow-diagram.svg',
        });
      }
    } catch (err) {
      console.error('Export SVG failed:', err);
    }
  };

  const handleExportJson = () => {
    if (irData) {
      downloadJsonIR(irData, 'algoflow-ir.json');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Navigation Header */}
      <Header
        stats={irData?.stats}
        validation={irData?.validation}
        direction={direction}
        onToggleDirection={handleToggleDirection}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onExportJson={handleExportJson}
        onOpenIR={() => setIsIrModalOpen(true)}
      />

      {/* Main Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Input Editor & Traceability */}
        <div className="w-full md:w-[420px] lg:w-[460px] shrink-0 h-full">
          <EditorPanel
            inputText={inputText}
            setInputText={setInputText}
            onAnalyze={() => handleAnalyze(inputText)}
            isLoading={isLoading}
            examples={examples}
            onSelectExample={handleSelectExample}
            selectedExampleId={selectedExampleId}
            statements={irData?.statements || []}
            selectedStatementIndex={selectedStatementIndex}
            onSelectStatement={handleSelectStatement}
            detectedVariables={irData?.detected_variables || []}
          />
        </div>

        {/* Right Side: Interactive Flowchart Canvas */}
        <div className="flex-1 h-full relative">
          <ReactFlowProvider>
            <FlowchartCanvas
              nodes={styledNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              selectedNode={selectedNode}
              onCloseDrawer={() => setSelectedNodeId(null)}
              onUpdateNodeLabel={handleUpdateNodeLabel}
              direction={direction}
              onRelayout={handleRelayout}
              onOpenNLP={() => setIsNlpModalOpen(true)}
              validation={irData?.validation}
              onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
              onSelectStatement={handleSelectStatement}
            />
          </ReactFlowProvider>
        </div>
      </div>

      {/* Modals */}
      <NLPInspectorModal
        isOpen={isNlpModalOpen}
        onClose={() => setIsNlpModalOpen(false)}
        statements={irData?.statements || []}
      />

      <IRViewerModal
        isOpen={isIrModalOpen}
        onClose={() => setIsIrModalOpen(false)}
        irData={irData}
      />

      <ImagePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
        imageDataUrl={previewModal.dataUrl}
        format={previewModal.format}
        filename={previewModal.filename}
      />
    </div>
  );
}

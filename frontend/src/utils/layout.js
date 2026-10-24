import dagre from 'dagre';

const NODE_DIMENSIONS = {
  start: { width: 160, height: 60 },
  end: { width: 160, height: 60 },
  input: { width: 210, height: 80 },
  output: { width: 210, height: 80 },
  process: { width: 230, height: 85 },
  decision: { width: 180, height: 120 },
  loop: { width: 230, height: 85 },
  ambiguous: { width: 230, height: 85 },
  default: { width: 200, height: 80 },
};

export const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: isHorizontal ? 60 : 70,
    ranksep: isHorizontal ? 80 : 75,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    const dim = NODE_DIMENSIONS[node.data?.type] || NODE_DIMENSIONS.default;
    dagreGraph.setNode(node.id, { width: dim.width, height: dim.height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const dim = NODE_DIMENSIONS[node.data?.type] || NODE_DIMENSIONS.default;

    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - dim.width / 2,
        y: nodeWithPosition.y - dim.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

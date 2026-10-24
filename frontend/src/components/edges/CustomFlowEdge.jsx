import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from '@xyflow/react';

const CustomFlowEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const isBackEdge = data?.edge_type === 'backedge' || label === 'Repeat';
  const isTrue = label === 'True';
  const isFalse = label === 'False';
  const isLoop = label === 'Loop';
  const isExit = label === 'Exit';

  let strokeColor = '#64748b';
  if (isTrue) strokeColor = '#10b981';
  else if (isFalse) strokeColor = '#f43f5e';
  else if (isLoop || isBackEdge) strokeColor = '#a855f7';
  else if (isExit) strokeColor = '#94a3b8';

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: isTrue || isFalse ? 2.5 : 2,
          strokeDasharray: isBackEdge ? '6 4' : undefined,
          animation: isBackEdge ? 'dashdraw 1.5s linear infinite' : undefined,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <span
              className={`edge-badge ${
                isTrue
                  ? 'edge-badge-true'
                  : isFalse
                  ? 'edge-badge-false'
                  : isLoop || isBackEdge
                  ? 'edge-badge-loop'
                  : 'edge-badge-exit'
              }`}
            >
              {isTrue && '✓ '}
              {isFalse && '✕ '}
              {isLoop && '↻ '}
              {isBackEdge && '⮌ '}
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(CustomFlowEdge);

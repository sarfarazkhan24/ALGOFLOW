import { toPng, toSvg } from 'html-to-image';
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';

/**
 * Downloads a data URL or Blob by routing through the backend /api/export-image
 * or using a named File object to guarantee that Chrome/Windows saves with
 * the exact filename and .png/.svg extension.
 */
export async function downloadFileWithExtension(dataUrl, format = 'png', fileName = 'algoflow-diagram.png') {
  // Method 1: Try Native File System Access API if supported (modern Chrome / Edge)
  if (window.showSaveFilePicker && format === 'png') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'PNG Flowchart Image',
            accept: { 'image/png': ['.png'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      if (err.name === 'AbortError') {
        return false; // User cancelled the save dialog
      }
      console.warn('showSaveFilePicker fallback:', err);
    }
  }

  // Method 2: Route through server endpoint for guaranteed Content-Disposition attachment header
  try {
    const response = await fetch('/api/export-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data_url: dataUrl,
        format: format,
        filename: fileName,
      }),
    });

    if (response.ok) {
      const blob = await response.blob();
      // Using a named File object rather than raw Blob ensures Chrome keeps the exact name
      const file = new File([blob], fileName, {
        type: format === 'png' ? 'image/png' : 'image/svg+xml',
      });
      const url = URL.createObjectURL(file);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 500);
      return true;
    }
  } catch (e) {
    console.warn('Backend download proxy failed, falling back to client anchor:', e);
  }

  // Method 3: Client-side anchor fallback with named File object
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], fileName, {
      type: format === 'png' ? 'image/png' : 'image/svg+xml',
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 500);
    return true;
  } catch (err) {
    console.error('Download failed completely:', err);
    return false;
  }
}

export const exportFlowchartToPng = async (nodes = [], fileName = 'algoflow-diagram.png') => {
  const element = document.querySelector('.react-flow__viewport');
  if (!element) {
    throw new Error('Flowchart canvas viewport not found');
  }

  let options = {
    backgroundColor: '#0a0d14',
    quality: 0.95,
    pixelRatio: 2, // 2x crisp high-DPI rendering
  };

  if (nodes && nodes.length > 0) {
    const bounds = getNodesBounds(nodes);
    const padding = 70;
    const width = Math.max(bounds.width + padding * 2, 400);
    const height = Math.max(bounds.height + padding * 2, 300);
    const transform = getViewportForBounds(
      bounds,
      width,
      height,
      0.5,
      2,
      0.15
    );

    options = {
      ...options,
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
    };
  }

  const dataUrl = await toPng(element, options);
  await downloadFileWithExtension(dataUrl, 'png', fileName);
  return dataUrl;
};

export const exportFlowchartToSvg = async (nodes = [], fileName = 'algoflow-diagram.svg') => {
  const element = document.querySelector('.react-flow__viewport');
  if (!element) {
    throw new Error('Flowchart canvas viewport not found');
  }

  let options = {
    backgroundColor: '#0a0d14',
  };

  if (nodes && nodes.length > 0) {
    const bounds = getNodesBounds(nodes);
    const padding = 70;
    const width = Math.max(bounds.width + padding * 2, 400);
    const height = Math.max(bounds.height + padding * 2, 300);
    const transform = getViewportForBounds(
      bounds,
      width,
      height,
      0.5,
      2,
      0.15
    );

    options = {
      ...options,
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
    };
  }

  const dataUrl = await toSvg(element, options);
  await downloadFileWithExtension(dataUrl, 'svg', fileName);
  return dataUrl;
};

export const downloadJsonIR = (irData, fileName = 'algoflow-ir.json') => {
  const jsonStr = JSON.stringify(irData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const file = new File([blob], fileName, { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 500);
};

export const copyToClipboard = async (text) => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
};

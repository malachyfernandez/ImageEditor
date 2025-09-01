import { useState, useRef, useEffect, useCallback } from 'react';
import heic2any from 'heic2any';

// Define constants for interaction handles
const HANDLE_SIZE = 12; // Increased from 8
const HANDLE_COLOR = 'rgba(0, 150, 255, 0.8)';

// Custom History Hook for Undo/Redo
const useHistory = (initialState) => {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const setState = useCallback((action, overwrite = false) => {
    const newState = typeof action === 'function' ? action(history[currentIndex]) : action;
    
    if (overwrite) {
      // For actions that shouldn't create a new history state, like dragging
      const newHistory = [...history];
      newHistory[currentIndex] = newState;
      setHistory(newHistory);
    } else {
      // For actions that should be undoable
      const newHistory = history.slice(0, currentIndex + 1);
      setHistory([...newHistory, newState]);
      setCurrentIndex(newHistory.length);
    }
  }, [currentIndex, history]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);

  return {
    state: history[currentIndex],
    setState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
};

// SVG Icon Components
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

// Define a reusable style for the key hints for cleanliness
const keyHintClass = "ml-2 text-xs border border-white/40 bg-transparent px-1.5 py-0.5 rounded font-sans";
const IconDuplicate = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
const IconUndo = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v6h6"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 9"></path></svg>;
const IconRedo = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3v6h-6"></path><path d="M20.95 13A9 9 0 1 1 18 5.3L21 9"></path></svg>;

// Toast Component
const Toast = ({ message, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 3000); // Hide after 3 seconds
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white py-2 px-4 rounded-md shadow-lg z-50 animate-fade-in-out">
      {message}
    </div>
  );
};

// Image Upload Modal Component
const ImageUploadModal = ({ onFileSelect, title, onClose }) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity">
      <div 
        className="bg-gray-800 p-8 rounded-lg text-center border border-gray-600 shadow-xl transform transition-all scale-105"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-400 mb-6">Drag & Drop an image file here</p>
        <span className="text-gray-500">or</span>
        <div className="mt-6">
          <label htmlFor="file-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-transform duration-200 ease-in-out hover:scale-105 inline-block">
            Choose File
          </label>
          <input id="file-upload" type="file" className="hidden" accept="image/*,.heic,.heif" onChange={handleFileChange} />
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="mt-4 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

function App() {
  // ✨ New: Replace individual states with the history hook
  const { state, setState, undo, redo, canUndo, canRedo } = useHistory({
    layers: [],
    baseImage: null,
    baseImageName: 'Background',
  });
  const { layers, baseImage, baseImageName } = state;

  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(true);
  
  // State for cropping
  const [isCropping, setIsCropping] = useState(false);
  const [cropBox, setCropBox] = useState(null);
  const [isQuickCrop, setIsQuickCrop] = useState(false);

  // ✨ New: Toast message state
  const [toastMessage, setToastMessage] = useState('');

  const visibleCanvasRef = useRef(null);
  const bufferCanvasRef = useRef(null);

  // State for tracking interactions
  const [interaction, setInteraction] = useState({
    isDragging: false,
    isScaling: false,
    isCropping: false,
    activeHandle: null,
    startPos: { x: 0, y: 0 },
    startLayerState: null,
  });

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

    // --- Layer State Management ---
  
  // ✨ Updated: Update layer with history
  const updateLayer = (id, newProps) => {
    setState(prevState => ({
      ...prevState,
      layers: prevState.layers.map(layer =>
        layer.id === id ? { ...layer, ...newProps } : layer
      )
    }));
  };

  // ✨ Updated: Delete layer with history
  const deleteLayer = (idToDelete) => {
    setState(prevState => ({
      ...prevState,
      layers: prevState.layers.filter(layer => layer.id !== idToDelete)
    }));
    
    if (selectedLayerId === idToDelete) {
      setSelectedLayerId('base'); // Select base layer if deleted layer was selected
    }
  };

  // ✨ New: Duplicate layer function
  const duplicateLayer = (idToDuplicate) => {
    setState(prevState => {
      const newLayers = [...prevState.layers];
      
      if (idToDuplicate === 'base') {
        const baseImg = new Image();
        baseImg.src = prevState.baseImage;
        const newLayer = {
          id: Date.now(),
          name: `${prevState.baseImageName} copy`,
          imageSrc: prevState.baseImage,
          img: baseImg,
          x: 0, y: 0, scale: 1, // Position exactly at the top-left
          crop: null,
          originalImageSrc: prevState.baseImage,
          originalImg: baseImg,
          blur: 0,
          feather: 0,
          featherStart: 0,
          cornerRadius: 0,
        };
        newLayers.unshift(newLayer);
        setSelectedLayerId(newLayer.id);
      } else {
        const layerIndex = newLayers.findIndex(l => l.id === idToDuplicate);
        if (layerIndex > -1) {
          const originalLayer = newLayers[layerIndex];
          const duplicatedLayer = {
            ...originalLayer,
            id: Date.now(), // Get a new unique ID
            name: `${originalLayer.name} copy`,
            // The position (x, y) is copied exactly from originalLayer via the spread (...)
          };
          newLayers.splice(layerIndex, 0, duplicatedLayer);
          setSelectedLayerId(duplicatedLayer.id);
        }
      }
      
      return { ...prevState, layers: newLayers };
    });
  };

  // ✨ Updated: Handle layer replacement with history
  const handleReplaceLayer = (e, layerToReplaceId) => {
    const file = e.target.files[0];
    if (file) {
      const layerToReplace = layers.find(l => l.id === layerToReplaceId);
      if (!layerToReplace) return;

      processAndSetImage(file, (dataUrl) => {
        const newImg = new Image();
        newImg.onload = () => {
          const oldLayerHeight = layerToReplace.img.height * layerToReplace.scale;
          const newScale = oldLayerHeight / newImg.naturalHeight;

          updateLayer(layerToReplaceId, {
            name: file.name,
            imageSrc: dataUrl,
            img: newImg,
            scale: newScale,
            originalImageSrc: dataUrl,
            originalImg: newImg,
            crop: null,
          });
        };
        newImg.src = dataUrl;
      });
    }
    e.target.value = null;
  };

  // Download single layer
  const handleDownloadLayer = () => {
    if (selectedLayerId === 'base') {
      // Download base image
      const link = document.createElement('a');
      link.download = `${baseImageName.split('.')[0]}-base.png`;
      link.href = baseImage;
      link.click();
      return;
    }

    if (!selectedLayer) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    const { img, scale } = selectedLayer;
    const w = img.width * scale;
    const h = img.height * scale;

    tempCanvas.width = w;
    tempCanvas.height = h;

    tempCtx.drawImage(img, 0, 0, w, h);

    const image = tempCanvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.download = `${selectedLayer.name.split('.')[0]}-layer.png`;
    link.href = image;
    link.click();
  };

  // ✨ Updated: Apply crop with history
  const applyCrop = () => {
    if (!cropBox || !selectedLayer || cropBox.width < 1 || cropBox.height < 1) {
      // If crop is invalid, just reset state without changing the image
      setIsCropping(false);
      setCropBox(null);
      return;
    }

    const { img, x: layerX, y: layerY, scale } = selectedLayer;
    
    // The current `img` object IS the one we want to crop from, not `originalImg`
    const cropX_on_img = (cropBox.x - layerX) / scale;
    const cropY_on_img = (cropBox.y - layerY) / scale;
    const cropW_on_img = cropBox.width / scale;
    const cropH_on_img = cropBox.height / scale;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropW_on_img;
    tempCanvas.height = cropH_on_img;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.drawImage(
      img, // IMPORTANT: Use the current `img`, not `originalImg`
      cropX_on_img, cropY_on_img,
      cropW_on_img, cropH_on_img,
      0, 0,
      cropW_on_img, cropH_on_img
    );

    const newImageDataUrl = tempCanvas.toDataURL('image/png');
    const newCroppedImage = new Image();
    newCroppedImage.onload = () => {
      // Create a new image object to serve as the new "original"
      const newOriginalImg = new Image();
      newOriginalImg.src = newImageDataUrl;

      // When the new original image is loaded, update the layer state
      newOriginalImg.onload = () => {
        updateLayer(selectedLayer.id, {
            // Update ALL image sources to the new cropped version
            imageSrc: newImageDataUrl,
            img: newCroppedImage,
            originalImageSrc: newImageDataUrl, // This is the key fix
            originalImg: newOriginalImg,       // This is the key fix

            // Reposition the layer to where the crop box was
            x: cropBox.x,
            y: cropBox.y,
            scale: 1, // Reset scale to 1 because the image is now its natural (cropped) size
            crop: null, // Clear the crop property as it has been applied
        });

        setIsCropping(false);
        setCropBox(null);
      };
    };
    newCroppedImage.src = newImageDataUrl;
  };

  // Open modal on startup if no base image
  useEffect(() => {
    if (!baseImage) {
      setIsModalOpen(true);
    }
  }, [baseImage]);

  // Global drag-and-drop listener
  useEffect(() => {
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleImageUpload(e.dataTransfer.files[0]);
        e.dataTransfer.clearData();
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [baseImage]);

  // ✨ New: Keyboard shortcuts for undo, redo, duplicate, and crop toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isModKey = e.metaKey || e.ctrlKey;
      
      if (isModKey && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      
      if (isModKey && e.key === 'd') {
        e.preventDefault();
        if (selectedLayerId) {
          duplicateLayer(selectedLayerId);
        }
      }
      
      // ✨ New: Delete layer shortcut
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId && selectedLayerId !== 'base') {
        e.preventDefault();
        deleteLayer(selectedLayerId);
      }
      
      // Spacebar now toggles crop mode
      if (e.code === 'Space' && !isCropping && selectedLayerId && selectedLayerId !== 'base') {
        e.preventDefault();
        toggleCropMode();
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'Space' && isCropping) {
        e.preventDefault();
        toggleCropMode(); // This will apply the crop on key up
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedLayerId, undo, redo, isCropping, deleteLayer]); // ✨ Note: deleteLayer should be added to dependencies if it's not stable

  // ✨ New: Function to toggle crop mode
  const toggleCropMode = () => {
    if (!selectedLayerId || selectedLayerId === 'base') return;
    
    const newIsCropping = !isCropping;
    setIsCropping(newIsCropping);
    
    if (newIsCropping) {
      setToastMessage('Drag on canvas to select area to crop');
    } else {
      // If there's a crop box, apply it. Otherwise, just exit.
      if (cropBox && cropBox.width > 5 && cropBox.height > 5) {
        applyCrop();
      } else {
        setCropBox(null); // Clear any tiny accidental crop box
      }
    }
  };

  // --- Image Handling Callbacks ---

  const processAndSetImage = async (file, imageSetter) => {
    setIsLoading(true);
    let fileToProcess = file;

    const isHeic = file.type.includes('heic') || file.type.includes('heif') || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

    if (isHeic) {
      if (typeof heic2any === 'undefined') {
        alert('HEIC conversion library is not available. Please try a different image format (JPEG, PNG, etc.).');
        setIsLoading(false);
        return;
      }

      if (typeof Worker === 'undefined') {
        alert('Web Workers are not supported in this browser. HEIC conversion requires Web Worker support.');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Starting HEIC conversion...');
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/png',
        });
        console.log('HEIC conversion successful');
        fileToProcess = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      } catch (error) {
        console.error('HEIC Conversion Error:', error);
        let errorMessage = 'Failed to convert HEIC image. ';
        if (error && error.message) {
          errorMessage += `Error: ${error.message}`;
        } else if (error && error.toString) {
          errorMessage += `Error: ${error.toString()}`;
        } else {
          errorMessage += 'Unknown error occurred.';
        }
        
        if (error && error.message && error.message.includes('ERR_LIBHEIF')) {
          errorMessage += '\n\nThis appears to be a decoder compatibility issue. Try converting the HEIC file to JPEG/PNG using your device\'s photo app first, then upload the converted file.';
        } else if (error && error.message && error.message.includes('Worker')) {
          errorMessage += '\n\nThis appears to be a Web Worker issue. Try using a different browser or updating your current browser.';
        }
        
        errorMessage += '\n\nCheck the developer console for more details.';
        alert(errorMessage);
        setIsLoading(false);
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      imageSetter(e.target.result);
      setIsLoading(false);
    };
    reader.onerror = (error) => {
      console.error('FileReader Error:', error);
      alert('Failed to read the image file. Check the console for details.');
      setIsLoading(false);
    };
    reader.readAsDataURL(fileToProcess);
  };

  // ✨ Updated: Unified image upload handler with history
  const handleImageUpload = (file) => {
    if (file) {
      processAndSetImage(file, (dataUrl) => {
        if (!baseImage) {
          setState({
            baseImage: dataUrl,
            baseImageName: 'Base Image',
            layers: [],
          });
          setSelectedLayerId('base'); // ✨ Select base layer by default
          setIsModalOpen(false);
        } else {
          addImageAsLayer(file, dataUrl);
          setIsModalOpen(false);
        }
      });
    }
  };

  // ✨ Updated: Add image as layer with history
  const addImageAsLayer = (file, dataUrl) => {
    const img = new Image();
    img.onload = () => {
      const canvas = visibleCanvasRef.current;
      if (!canvas) return;

      // Calculate scale to fit canvas
      const scaleX = canvas.width / img.width;
      const scaleY = canvas.height / img.height;
      const scale = Math.min(scaleX, scaleY);

      const newLayer = {
        id: Date.now(),
        name: file.name,
        imageSrc: dataUrl,
        img,
        x: (canvas.width - img.width * scale) / 2,
        y: (canvas.height - img.height * scale) / 2,
        scale: scale,
        crop: null,
        originalImageSrc: dataUrl,
        originalImg: img,
        blur: 0,
        feather: 0,
        featherStart: 0,
        cornerRadius: 0,
      };
      
      setState(prevState => ({
        ...prevState,
        layers: [newLayer, ...prevState.layers]
      }));
      setSelectedLayerId(newLayer.id);
    };
    img.src = dataUrl;
  };



  // --- Path Creation Helper ---
  const createRoundedRectPath = (ctx, x, y, width, height, radius) => {
    if (width < 0) width = 0;
    if (height < 0) height = 0;
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  };

  // ✨ New: Abstracted layer drawing function
  const drawLayer = (ctx, layer) => {
    const { img, x, y, scale, blur, feather, cornerRadius } = layer;
    const w = img.width * scale;
    const h = img.height * scale;

    if (blur > 0) {
      ctx.filter = `blur(${blur}px)`;
    }

    if (feather > 0) {
      const padding = feather;
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = w + 2 * padding;
      tempCanvas.height = h + 2 * padding;

      const maskCanvas = document.createElement('canvas');
      const maskCtx = maskCanvas.getContext('2d');
      maskCanvas.width = tempCanvas.width;
      maskCanvas.height = tempCanvas.height;

      const inset = layer.featherStart || 0;
      const innerX = padding + inset;
      const innerY = padding + inset;
      let innerW = w - 2 * inset;
      let innerH = h - 2 * inset;
      if (innerW < 1) innerW = 1;
      if (innerH < 1) innerH = 1;

      const effectiveCornerRadius = Math.max(0, cornerRadius - inset);
      maskCtx.filter = `blur(${feather}px)`;
      maskCtx.fillStyle = 'black';
      createRoundedRectPath(maskCtx, innerX, innerY, innerW, innerH, effectiveCornerRadius);
      maskCtx.fill();

      tempCtx.drawImage(img, padding, padding, w, h);
      tempCtx.globalCompositeOperation = 'destination-in';
      tempCtx.drawImage(maskCanvas, 0, 0);
      ctx.drawImage(tempCanvas, x - padding, y - padding);
    } else {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = w;
      tempCanvas.height = h;
      createRoundedRectPath(tempCtx, 0, 0, w, h, cornerRadius);
      tempCtx.clip();
      tempCtx.drawImage(img, 0, 0, w, h);
      ctx.drawImage(tempCanvas, x, y);
    }
  };

  // --- Main Drawing Logic ---
  const draw = useCallback(() => {
    const visibleCanvas = visibleCanvasRef.current;
    const bufferCanvas = bufferCanvasRef.current;
    const ctx = bufferCanvas?.getContext('2d');

    if (!visibleCanvas || !bufferCanvas || !ctx || !baseImage) return;

    const baseImg = new Image();
    baseImg.onload = () => {
      bufferCanvas.width = baseImg.width;
      bufferCanvas.height = baseImg.height;
      visibleCanvas.width = baseImg.width;
      visibleCanvas.height = baseImg.height;

      ctx.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);
      ctx.drawImage(baseImg, 0, 0);

      // ✨ Updated: Enhanced layer drawing with cropping preview
      layers.forEach(layer => {
        if (!layer.img) return;
        
        const isSelected = layer.id === selectedLayerId;
        
        ctx.save();
        
        if (isCropping && isSelected) {
          // 1. Draw the layer normally, then overlay a dark tint
          drawLayer(ctx, layer); // Draw the layer at full opacity
          
          const { x, y, scale, img } = layer;
          const w = img.width * scale;
          const h = img.height * scale;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // A semi-transparent black
          ctx.fillRect(x, y, w, h); // Draw it over the entire layer

          // 2. "Cut out" the opaque crop box area
          if (cropBox) {
            ctx.globalAlpha = 1.0; // Set to full opacity
            ctx.save();
            ctx.beginPath();
            ctx.rect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
            ctx.clip(); // Clip to the crop box
            // Redraw the same layer, which will only appear inside the clip
            drawLayer(ctx, layer);
            ctx.restore();
          }
        } else {
          // ✨ Normal drawing logic
          drawLayer(ctx, layer);
        }

        ctx.restore();
      });

      // Draw crop box if active
      if (isCropping && cropBox && selectedLayerId) {
        ctx.fillStyle = 'rgba(0, 150, 255, 0.2)';
        ctx.strokeStyle = HANDLE_COLOR;
        ctx.lineWidth = 2; // Increased from 1
        ctx.fillRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
        ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      }
      
      if (selectedLayer && !isCropping) {
        drawSelectionHandles(ctx, selectedLayer);
      }

      const visibleCtx = visibleCanvas.getContext('2d');
      visibleCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);
      visibleCtx.drawImage(bufferCanvas, 0, 0);
    };
    baseImg.src = baseImage;
  }, [baseImage, layers, selectedLayer, isCropping, cropBox]);

  useEffect(() => {
    draw();
  }, [draw]);

  // --- Selection and Manipulation Logic ---
  const getLayerHandles = (layer) => {
    const { x, y, scale, img } = layer;
    const w = img.width * scale;
    const h = img.height * scale;
    return {
      topLeft: { x: x - HANDLE_SIZE / 2, y: y - HANDLE_SIZE / 2 },
      topRight: { x: x + w - HANDLE_SIZE / 2, y: y - HANDLE_SIZE / 2 },
      bottomLeft: { x: x - HANDLE_SIZE / 2, y: y + h - HANDLE_SIZE / 2 },
      bottomRight: { x: x + w - HANDLE_SIZE / 2, y: y + h - HANDLE_SIZE / 2 },
    };
  };

  const drawSelectionHandles = (ctx, layer) => {
    const { x, y, scale, img } = layer;
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.strokeStyle = HANDLE_COLOR;
    ctx.lineWidth = 2; // Increased from 1
    ctx.strokeRect(x, y, w, h);
    const handles = getLayerHandles(layer);
    ctx.fillStyle = HANDLE_COLOR;
    Object.values(handles).forEach(handle => ctx.fillRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE));
  };

  const getMousePos = (e) => {
    const canvas = visibleCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e) => {
    if (isCropping && selectedLayer) {
      const mousePos = getMousePos(e);
      setInteraction({ isCropping: true, startPos: mousePos });
      setCropBox({ x: mousePos.x, y: mousePos.y, width: 0, height: 0 });
      return;
    }

    const mousePos = getMousePos(e);
    if (selectedLayer) {
      const handles = getLayerHandles(selectedLayer);
      for (const [pos, handle] of Object.entries(handles)) {
        if (mousePos.x >= handle.x && mousePos.x <= handle.x + HANDLE_SIZE &&
            mousePos.y >= handle.y && mousePos.y <= handle.y + HANDLE_SIZE) {
          setInteraction({ isDragging: false, isScaling: true, activeHandle: pos, startPos: mousePos, startLayerState: { ...selectedLayer } });
          return;
        }
      }
    }
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const { x, y, scale, img } = layer;
      const w = img.width * scale;
      const h = img.height * scale;
      if (mousePos.x >= x && mousePos.x <= x + w && mousePos.y >= y && mousePos.y <= y + h) {
        setSelectedLayerId(layer.id);
        setInteraction({ isDragging: true, isScaling: false, startPos: mousePos, startLayerState: { ...layer } });
        return;
      }
    }
    setSelectedLayerId(null);
  };

  const handleMouseMove = (e) => {
    if (interaction.isCropping) {
      const mousePos = getMousePos(e);
      const startPos = interaction.startPos;
      const newCropBox = {
        x: Math.min(mousePos.x, startPos.x),
        y: Math.min(mousePos.y, startPos.y),
        width: Math.abs(mousePos.x - startPos.x),
        height: Math.abs(mousePos.y - startPos.y),
      };
      setCropBox(newCropBox);
      return;
    }

    if (!interaction.isDragging && !interaction.isScaling) return;
    const mousePos = getMousePos(e);
    const dx = mousePos.x - interaction.startPos.x;
    const dy = mousePos.y - interaction.startPos.y;
    const startState = interaction.startLayerState;

    if (interaction.isDragging) {
      // ✨ Use overwrite=true for real-time dragging updates
      setState(prevState => ({
        ...prevState,
        layers: prevState.layers.map(layer =>
          layer.id === startState.id ? { ...layer, x: startState.x + dx, y: startState.y + dy } : layer
        )
      }), true);
    } else if (interaction.isScaling) {
      const { img, x: startX, y: startY, scale: startScale } = startState;
      const startW = img.width * startScale;
      let newW = startW, newX = startX;
      if (interaction.activeHandle.includes('Right')) newW = startW + dx;
      if (interaction.activeHandle.includes('Left')) { newW = startW - dx; newX = startX + dx; }
      if (newW < 10) newW = 10;
      const newScale = newW / img.width;
      let newY = startY;
      if (interaction.activeHandle.includes('Top')) {
        const hChange = (img.height * newScale) - (img.height * startScale);
        newY = startY - hChange;
      }
      
      // ✨ Use overwrite=true for real-time scaling updates
      setState(prevState => ({
        ...prevState,
        layers: prevState.layers.map(layer =>
          layer.id === startState.id ? { ...layer, x: newX, y: newY, scale: newScale } : layer
        )
      }), true);
    }
  };

  const handleMouseUp = () => {
    if (interaction.isCropping) {
      // We no longer call applyCrop() here.
      // We just reset the interaction state, leaving the cropBox intact.
      // The user will now press Space or click the Crop button to finalize.
      setInteraction({ isCropping: false });
      return;
    }
    // If we just finished a drag or scale, we want to create a new history entry.
    // The `overwrite: true` in handleMouseMove prevents history spam during the move.
    // Now that the move is done, we call setState one last time without `overwrite`.
    if (interaction.isDragging || interaction.isScaling) {
        setState(state => ({...state})); // Creates a new undo state
    }
    setInteraction({ isDragging: false, isScaling: false, activeHandle: null, startPos: { x: 0, y: 0 }, startLayerState: null });
  };

  const handleDownloadImage = () => {
    const canvas = visibleCanvasRef.current;
    if (canvas) {
      const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const link = document.createElement('a');
      link.download = "canvas-composition.png";
      link.href = image;
      link.click();
    }
  };

  // ✨ New: Convenience variable for current selection
  const currentSelection = selectedLayerId === 'base'
    ? { id: 'base', name: baseImageName }
    : selectedLayer;

  // --- JSX ---
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      {isModalOpen && (
        <ImageUploadModal 
          onFileSelect={handleImageUpload}
          title={baseImage ? "Add a New Layer" : "Start with a Base Image"}
          onClose={baseImage ? () => setIsModalOpen(false) : null}
        />
      )}
      
      <aside className="w-80 bg-gray-800 p-4 flex flex-col flex-shrink-0">
        {/* ✨ Updated: Header with undo/redo buttons */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Layers</h1>
          <div className="flex items-center space-x-2">
            <button 
              onClick={undo} 
              disabled={!canUndo} 
              className="disabled:text-gray-600 text-gray-400 hover:text-white transition-colors"
              title="Undo (Ctrl/Cmd + Z)"
            >
              <IconUndo />
            </button>
            <button 
              onClick={redo} 
              disabled={!canRedo} 
              className="disabled:text-gray-600 text-gray-400 hover:text-white transition-colors"
              title="Redo (Ctrl/Cmd + Shift + Z)"
            >
              <IconRedo />
            </button>
          </div>
        </div>
        
        {/* ✨ Updated: Layer List with hover effects and duplicate buttons */}
        <div className="flex-1 overflow-y-auto space-y-1 flex flex-col-reverse">
          {/* Base Image as a layer */}
          {baseImage && (
            <div 
              className={`group cursor-pointer p-2 mt-4 rounded-md flex items-center justify-between transition-all mb-1 ${selectedLayerId === 'base' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}`}
              onClick={() => setSelectedLayerId('base')}
            >
              <span className="truncate flex-1">{baseImageName}</span>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); duplicateLayer('base'); }} 
                  className="ml-2 mr-[-0.25rem] text-gray-400 hover:text-white transition-colors"
                  title="Duplicate (Ctrl/Cmd + D)"
                >
                  <IconDuplicate />
                </button>
                <span className={keyHintClass}>⌘D</span>
              </div>
            </div>
          )}
          
          {/* Dynamic Layers */}
          {layers.map((layer) => (
            <div 
              key={layer.id} 
              className={`group cursor-pointer p-2 rounded-md flex items-center justify-between transition-all ${selectedLayerId === layer.id ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}`}
              onClick={() => setSelectedLayerId(layer.id)}
            >
              <span className="truncate flex-1">{layer.name}</span>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Duplicate button remains the same */}
                <button 
                  onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }} 
                  className="ml-2 mr-[-0.25rem] text-gray-400 hover:text-white transition-colors"
                  title="Duplicate (Ctrl/Cmd + D)"
                >
                  <IconDuplicate />
                </button>
                <span className={keyHintClass}>⌘D</span>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                  className="ml-2 mr-[-0.25rem] mr text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete Layer (Del/Backspace)"
                >
                  <IconX />
                </button>
                <span className={keyHintClass}>Del</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Layer Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-transform duration-200 ease-in-out hover:scale-105"
          disabled={!baseImage}
        >
          + New Layer
        </button>

        <hr className="border-gray-600 my-4" />

        {/* ✨ Updated: Selected Layer Controls with base layer support */}
        {currentSelection && (
          <div className="p-2 bg-gray-700 rounded-md">
            {/* Rename Input */}
            <input 
              type="text" 
              value={currentSelection.name}
              onChange={(e) => {
                if (selectedLayerId === 'base') {
                  setState(prev => ({...prev, baseImageName: e.target.value }), true);
                } else {
                  updateLayer(currentSelection.id, { name: e.target.value });
                }
              }}
              className="w-full bg-gray-800 border border-gray-600 rounded p-1 mb-3 text-white"
            />
            
            {/* ✨ Updated: Controls with conditional disabling for base layer */}
            <div className={selectedLayerId === 'base' ? 'opacity-50 pointer-events-none' : ''}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-400">Rounded Corners</label>
                <input type="range" min="0" max="200" value={selectedLayer?.cornerRadius || 0}
                  onChange={(e) => updateLayer(currentSelection.id, { cornerRadius: parseInt(e.target.value) })}
                  className="w-full" />
                <span>{selectedLayer?.cornerRadius || 0}px</span>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-400">Feather</label>
                <input type="range" min="0" max="100" value={selectedLayer?.feather || 0}
                  onChange={(e) => updateLayer(currentSelection.id, { feather: parseInt(e.target.value), featherStart: parseInt(e.target.value*2.5) })}
                  className="w-full" />
                <span>{selectedLayer?.feather || 0}px</span>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-400">Feather Start (Inset)</label>
                <input type="range" min="0" max="100" value={selectedLayer?.featherStart || 0}
                  onChange={(e) => updateLayer(currentSelection.id, { featherStart: parseInt(e.target.value) })}
                  className="w-full" />
                <span>{selectedLayer?.featherStart || 0}px</span>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-400">Blur</label>
                <input type="range" min="0" max="20" value={selectedLayer?.blur || 0}
                  onChange={(e) => updateLayer(currentSelection.id, { blur: parseInt(e.target.value) })}
                  className="w-full" />
                <span>{selectedLayer?.blur || 0}px</span>
              </div>
            </div>

            {/* ✨ Updated: Action Buttons with better organization */}
            <div className="mt-4 space-y-2">
              <button 
                onClick={toggleCropMode}
                disabled={selectedLayerId === 'base'}
                className="w-full flex justify-center items-center gap-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-sm py-1 px-2 rounded transition-colors"
                title="Toggle crop mode (Space)"
              >
                Crop
                <span className={keyHintClass}>space</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <label 
                  htmlFor={`replace-${currentSelection.id}`} 
                  className={`text-center cursor-pointer bg-gray-600 hover:bg-gray-500 text-sm py-1 px-2 rounded transition-colors ${selectedLayerId === 'base' ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  Replace
                </label>
                <input 
                  id={`replace-${currentSelection.id}`} 
                  type="file" 
                  className="hidden" 
                  accept="image/*,.heic,.heif" 
                  onChange={(e) => handleReplaceLayer(e, currentSelection.id)}
                />
                <button 
                  onClick={handleDownloadLayer} 
                  className="bg-gray-600 hover:bg-gray-500 text-sm py-1 px-2 rounded transition-colors"
                >
                  Download Layer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && <p className="text-center text-gray-400 mt-4">Processing image, please wait...</p>}
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-gray-700 p-4 shadow-md flex justify-between items-center">
          <h2 className="text-xl">Canvas</h2>
          <button onClick={handleDownloadImage} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">Download Image</button>
        </header>

        <section className="flex-1 flex items-center justify-center bg-gray-600 overflow-auto p-4">
          {baseImage ? (
            <canvas
              ref={visibleCanvasRef}
              className="bg-white shadow-lg max-w-full max-h-full"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          ) : (
            <div className="border-2 border-dashed border-gray-400 p-12 text-center">
              <p>Upload a base image to begin</p>
            </div>
          )}
        </section>
      </main>

      <canvas ref={bufferCanvasRef} style={{ display: 'none' }} />
      
      {/* ✨ New: Toast component */}
      {toastMessage && <Toast message={toastMessage} onDone={() => setToastMessage('')} />}
    </div>
  );
}

export default App;
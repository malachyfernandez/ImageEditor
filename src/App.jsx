import { useState, useRef, useEffect, useCallback } from 'react';
import heic2any from 'heic2any';

// Define constants for interaction handles
const HANDLE_SIZE = 12;
const HANDLE_COLOR = 'rgba(0, 150, 255, 0.8)';
const keyHintClass = "ml-2 text-xs border border-white/40 bg-transparent px-1.5 py-0.5 rounded font-sans select-none";

// useHistory hook to include baseImageEffects
const useHistory = (initialState) => {
  const [history, setHistory] = useState([{ state: initialState, actionName: 'Initial' }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const setState = useCallback((action, options = {}) => {
    const { overwrite = false, actionName = 'Update' } = options;
    const currentState = history[currentIndex].state;
    const newState = typeof action === 'function' ? action(currentState) : action;

    if (overwrite) {
      const newHistory = [...history];
      newHistory[currentIndex] = { ...newHistory[currentIndex], state: newState };
      setHistory(newHistory);
    } else {
      if (JSON.stringify(currentState) === JSON.stringify(newState)) return;
      const newHistory = history.slice(0, currentIndex + 1);
      setHistory([...newHistory, { state: newState, actionName }]);
      setCurrentIndex(newHistory.length);
    }
  }, [currentIndex, history]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const actionName = history[currentIndex].actionName;
      setCurrentIndex(prev => prev - 1);
      return actionName;
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const actionName = history[currentIndex + 1].actionName;
      setCurrentIndex(prev => prev + 1);
      return actionName;
    }
    return null;
  }, [currentIndex, history]);

  return {
    state: history[currentIndex].state,
    setState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
};


// SVG Icon Components
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconDuplicate = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
const IconUndo = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v6h6"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 9"></path></svg>;
const IconRedo = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3v6h-6"></path><path d="M20.95 13A9 9 0 1 1 18 5.3L21 9"></path></svg>;
const IconDragHandle = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const IconMagic = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z" /><path d="M22 12l-3 3" /><path d="M12 22l3-3" /></svg>;
const IconBrightness = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const IconContrast = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 18a6 6 0 0 0 0-12v12z"></path></svg>;
const IconSaturation = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>;
const IconHue = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8"></path><circle cx="12" cy="12" r="2"></circle></svg>;
const IconBlur = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4z"></path></svg>;

// NEW: SVG Icons for Settings and UI Chevrons
const IconSettings = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconChevron = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;

// Toast Component
const Toast = ({ message, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDone(), 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed bottom-5 right-5 bg-gray-900 text-white py-2 px-5 rounded-lg shadow-2xl z-50 animate-toast-in-out">
      {message}
    </div>
  );
};

// Loading Spinner Overlay
const LoadingSpinner = ({ message }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-[60]">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
    <p className="text-white text-xl mt-4">{message}</p>
  </div>
);

// Styled Dropdown for Blend Modes
const StyledDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } }); // Mimic event object
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800 border border-gray-600 rounded p-1.5 mt-1 text-sm flex justify-between items-center"
      >
        <span className="capitalize">{value}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      {isOpen && (
        <div className="absolute bottom-full mb-1 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto z-10">
          {options.map(option => (
            <div
              key={option}
              onClick={() => handleSelect(option)}
              className="p-2 text-sm capitalize hover:bg-blue-600 cursor-pointer"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper: Generic Modal Component
const Modal = ({ children, onClose, title }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={handleBackdropClick}>
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-600 shadow-xl transform transition-all scale-105 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"><IconX /></button>
        <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>
        {children}
      </div>
    </div>
  );
};

// NEW: Collapsible Section Component
const CollapsibleSection = ({ title, isOpen, onToggle, children }) => {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-md font-semibold text-gray-300 border-b border-gray-600 pb-1 mb-2"
      >
        <span>{title}</span>
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
          <IconChevron />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out`}
        style={{ maxHeight: isOpen ? '500px' : '0px' }} // Use max-height for animation
      >
        <div className="pt-2">
          {children}
        </div>
      </div>
    </div>
  );
};

// NEW: Settings Modal Component
const SettingsModal = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-300">Default Panel State</h3>
          <label className="flex items-center justify-between p-2 bg-gray-700 rounded-md">
            <span>Adjustments Panel Open by Default</span>
            <input type="checkbox" className="toggle"
              checked={localSettings.defaultAdjustmentsOpen}
              onChange={(e) => handleSettingChange('defaultAdjustmentsOpen', e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between p-2 bg-gray-700 rounded-md">
            <span>Masking Panel Open by Default</span>
            <input type="checkbox" className="toggle"
              checked={localSettings.defaultMaskingOpen}
              onChange={(e) => handleSettingChange('defaultMaskingOpen', e.target.checked)}
            />
          </label>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-300">AI Settings</h3>
          <label className="block p-2 bg-gray-700 rounded-md">
            <span>Gemini API Key</span>
            <div>
              <input
                type="password"
                placeholder="Your Google AI API Key"
                className={`w-full bg-gray-800 border rounded p-1 mt-1 text-white ${!localSettings.apiKey ? 'border-red-500' : 'border-gray-600'
                  }`}
                value={localSettings.apiKey}
                onChange={(e) => handleSettingChange('apiKey', e.target.value)}
              />
              {!localSettings.apiKey && (
                <p className="text-red-500 text-xs mt-1">
                  Needed to use AI features
                </p>
              )}
            </div>
          </label>
          <label className="block p-2 bg-gray-700 rounded-md">
            <span>Default AI Edit Feather (%)</span>
            <input type="number"
              min="0" max="50"
              className="w-full bg-gray-800 border border-gray-600 rounded p-1 mt-1 text-white"
              value={localSettings.aiFeatherPercent}
              onChange={(e) => handleSettingChange('aiFeatherPercent', parseInt(e.target.value, 10))}
            />
          </label>
        </div>
        <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-2 px-4 rounded mt-4">Save and Close</button>
      </div>
    </Modal>
  );
};


// Main Application Component
function App() {
  // Helper for OS-specific shortcuts
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKeySymbol = isMac ? '⌘' : 'Ctrl';

  const { state, setState, undo, redo, canUndo, canRedo } = useHistory({
    layers: [],
    baseImage: null,
    baseImageName: 'Background',
    baseImageEffects: { blur: 0, brightness: 100, contrast: 100, saturation: 100, hue: 0 },
  });
  const { layers, baseImage, baseImageName, baseImageEffects } = state;

  // Settings state, loaded from localStorage
  const [settings, setSettings] = useState(() => {
    const savedSettingsJSON = localStorage.getItem('photoEditorSettings');
    const defaultSettings = {
      defaultAdjustmentsOpen: false,
      defaultMaskingOpen: true,
      apiKey: '',
      aiFeatherPercent: 5,
    };

    if (savedSettingsJSON) {
      // Ensure all keys are present even if loading older settings
      return { ...defaultSettings, ...JSON.parse(savedSettingsJSON) };
    }

    const oldApiKey = localStorage.getItem('geminiApiKey');
    if (oldApiKey) {
      return { ...defaultSettings, apiKey: oldApiKey };
    }

    return defaultSettings;
  });

  // UI State for panels and modals
  const [isAdjustmentsOpen, setIsAdjustmentsOpen] = useState(settings.defaultAdjustmentsOpen);
  const [isMaskingOpen, setIsMaskingOpen] = useState(settings.defaultMaskingOpen);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isCropping, setIsCropping] = useState(false);
  const [cropBox, setCropBox] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [activeEffect, setActiveEffect] = useState('brightness');
  const [isAiPromptModalOpen, setIsAiPromptModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [draggedLayerId, setDraggedLayerId] = useState(null);

  // Function to save settings to state and localStorage
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('photoEditorSettings', JSON.stringify(newSettings));
    setIsAdjustmentsOpen(newSettings.defaultAdjustmentsOpen);
    setIsMaskingOpen(newSettings.defaultMaskingOpen);
    setToastMessage("Settings saved!");
  };

  const visibleCanvasRef = useRef(null);
  const bufferCanvasRef = useRef(null);
  const interaction = useRef({ isDragging: false, isScaling: false, isCropping: false, activeHandle: null, startPos: { x: 0, y: 0 }, startLayerState: null }).current;
  const aiPromptInputRef = useRef(null); // Ref for AI prompt textarea

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  // --- Undo/Redo Handlers ---
  const handleUndo = useCallback(() => {
    const actionName = undo();
    if (actionName) setToastMessage(`Undid ${actionName}`);
  }, [undo]);

  const handleRedo = useCallback(() => {
    const actionName = redo();
    if (actionName) setToastMessage(`Redid ${actionName}`);
  }, [redo]);

  // --- Layer State Management ---
  const updateLayer = (id, newProps, options) => {
    setState(prevState => ({
      ...prevState,
      layers: prevState.layers.map(layer => layer.id === id ? { ...layer, ...newProps } : layer)
    }), options);
  };

  const deleteLayer = useCallback((idToDelete) => {
    setState(prevState => ({
      ...prevState,
      layers: prevState.layers.filter(layer => layer.id !== idToDelete)
    }), { actionName: 'Delete Layer' });
    if (selectedLayerId === idToDelete) setSelectedLayerId('base');
  }, [selectedLayerId, setState]);

  const duplicateLayer = useCallback((idToDuplicate) => {
    setState(prevState => {
      const newLayers = [...prevState.layers];
      let newLayer;
      if (idToDuplicate === 'base') {
        const baseImg = new Image();
        baseImg.src = prevState.baseImage;
        newLayer = {
          id: Date.now(),
          name: `${prevState.baseImageName} copy`,
          imageSrc: prevState.baseImage,
          img: baseImg, x: 0, y: 0, scale: 1,
          originalImageSrc: prevState.baseImage, originalImg: baseImg,
          blur: 0, feather: 0, featherStart: 0, cornerRadius: 0, blendMode: 'normal',
          brightness: 100, contrast: 100, saturation: 100, hue: 0,
        };
        newLayers.unshift(newLayer);
      } else {
        const layerIndex = newLayers.findIndex(l => l.id === idToDuplicate);
        if (layerIndex > -1) {
          const originalLayer = newLayers[layerIndex];
          newLayer = { ...originalLayer, id: Date.now(), name: `${originalLayer.name} copy` };
          newLayers.splice(layerIndex, 0, newLayer);
        }
      }
      if (newLayer) setSelectedLayerId(newLayer.id);
      return { ...prevState, layers: newLayers };
    }, { actionName: 'Duplicate Layer' });
  }, [setState]);

  const handleReplaceLayer = (file, layerToReplaceId) => {
    const layerToReplace = layers.find(l => l.id === layerToReplaceId);
    if (!layerToReplace || !file) return;

    processAndSetImage(file, (dataUrl) => {
      const newImg = new Image();
      newImg.onload = () => {
        const oldLayerHeight = layerToReplace.img.height * layerToReplace.scale;
        const newScale = oldLayerHeight / newImg.naturalHeight;
        updateLayer(layerToReplaceId, {
          name: file.name, imageSrc: dataUrl, img: newImg,
          scale: isNaN(newScale) ? 1 : newScale,
          originalImageSrc: dataUrl, originalImg: newImg, crop: null,
        }, { actionName: 'Replace Layer' });
      };
      newImg.src = dataUrl;
    });
  };

  const applyCrop = useCallback(() => {
    if (!cropBox || !selectedLayer || cropBox.width < 1 || cropBox.height < 1) {
      setIsCropping(false); setCropBox(null); return;
    }
    const { img, x: layerX, y: layerY, scale } = selectedLayer;
    const cropX = (cropBox.x - layerX) / scale, cropY = (cropBox.y - layerY) / scale;
    const cropW = cropBox.width / scale, cropH = cropBox.height / scale;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropW; tempCanvas.height = cropH;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    const newImageDataUrl = tempCanvas.toDataURL('image/png');
    const newCroppedImage = new Image();
    newCroppedImage.onload = () => {
      updateLayer(selectedLayer.id, {
        imageSrc: newImageDataUrl, img: newCroppedImage,
        originalImageSrc: newImageDataUrl, originalImg: newCroppedImage,
        x: cropBox.x, y: cropBox.y, scale: 1, crop: null,
      }, { actionName: 'Crop Layer' });
      setIsCropping(false); setCropBox(null);
    };
    newCroppedImage.src = newImageDataUrl;
  }, [cropBox, selectedLayer, updateLayer]);

  const toggleCropMode = useCallback(() => {
    if (selectedLayerId === 'base') {
      setToastMessage("Cannot crop the base layer. Please duplicate it first.");
      return;
    }
    if (isCropping) {
      if (cropBox && cropBox.width > 5 && cropBox.height > 5) applyCrop();
      else { setIsCropping(false); setCropBox(null); }
    } else {
      setIsCropping(true); setToastMessage('Drag on canvas to select area to crop');
    }
  }, [selectedLayerId, isCropping, cropBox, applyCrop]);

  // --- Image Handling Callbacks ---
  const processAndSetImage = async (file, imageSetter) => {
    setLoadingMessage('Processing Image...');
    setIsLoading(true);
    try {
      let fileToProcess = file;
      const isHeic = file.type.includes('heic') || file.type.includes('heif') || file.name.toLowerCase().endsWith('.heic');
      if (isHeic) {
        const convertedBlob = await heic2any({ blob: file, toType: 'image/png' });
        fileToProcess = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      }
      const reader = new FileReader();
      reader.onload = (e) => imageSetter(e.target.result);
      reader.readAsDataURL(fileToProcess);
    } catch (error) {
      console.error('Image Processing Error:', error);
      setToastMessage(`Error processing image: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleImageUpload = useCallback((file) => {
    if (file) {
      processAndSetImage(file, (dataUrl) => {
        if (!baseImage) {
          setState({ baseImage: dataUrl, baseImageName: file.name, layers: [], baseImageEffects: { blur: 0, brightness: 100, contrast: 100, saturation: 100, hue: 0 } }, { actionName: 'Set Base Image' });
          setSelectedLayerId('base');
          setIsModalOpen(false);
        } else {
          addImageAsLayer(file, dataUrl);
          setIsModalOpen(false);
        }
      });
    }
  }, [baseImage, setState]);

  const addImageAsLayer = (file, dataUrl) => {
    const img = new Image();
    img.onload = () => {
      const canvas = visibleCanvasRef.current;
      if (!canvas) return;
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height, 1) * 0.8;
      const newLayer = {
        id: Date.now(), name: file.name, imageSrc: dataUrl, img,
        x: (canvas.width - img.width * scale) / 2,
        y: (canvas.height - img.height * scale) / 2,
        scale, originalImageSrc: dataUrl, originalImg: img,
        blur: 0, feather: 0, featherStart: 0, cornerRadius: 0, blendMode: 'normal',
        brightness: 100, contrast: 100, saturation: 100, hue: 0,
      };
      setState(prevState => ({ ...prevState, layers: [newLayer, ...prevState.layers] }), { actionName: 'Add Layer' });
      setSelectedLayerId(newLayer.id);
    };
    img.src = dataUrl;
  };

  const handleDownloadComposition = () => {
    const canvas = visibleCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'composition.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadLayer = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let downloadName = 'layer.png';

    if (selectedLayerId === 'base') {
      const baseImg = new Image();
      baseImg.onload = () => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx.drawImage(baseImg, 0, 0);
        const link = document.createElement('a');
        link.download = `${baseImageName.split('.')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
      baseImg.src = baseImage;
      return;
    }

    if (!selectedLayer) return;
    const { img, scale } = selectedLayer;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    drawLayer(ctx, { ...selectedLayer, x: 0, y: 0 });
    downloadName = `${selectedLayer.name.split('.')[0]}.png`;

    const link = document.createElement('a');
    link.download = downloadName;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // --- Drawing Logic ---
  const createRoundedRectPath = (ctx, x, y, w, h, r) => {
    if (w < 2 * r) r = w / 2; if (h < 2 * r) r = h / 2;
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  const drawLayer = (ctx, layer) => {
    const { img, x, y, scale, blur, feather, cornerRadius, blendMode, brightness, contrast, saturation, hue } = layer;
    const w = img.width * scale; const h = img.height * scale;

    ctx.save();
    ctx.globalCompositeOperation = blendMode || 'source-over';

    const filters = [];
    if (blur > 0) filters.push(`blur(${blur}px)`);
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
    if (hue !== 0) filters.push(`hue-rotate(${hue}deg)`);
    ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';

    if (feather > 0) {
      const padding = feather;
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = w + 2 * padding; tempCanvas.height = h + 2 * padding;
      const maskCanvas = document.createElement('canvas');
      const maskCtx = maskCanvas.getContext('2d');
      maskCanvas.width = tempCanvas.width; maskCanvas.height = tempCanvas.height;
      const inset = layer.featherStart || 0;
      createRoundedRectPath(maskCtx, padding + inset, padding + inset, w - 2 * inset, h - 2 * inset, Math.max(0, cornerRadius - inset));
      maskCtx.fillStyle = 'black'; maskCtx.filter = `blur(${feather}px)`; maskCtx.fill();
      tempCtx.drawImage(img, padding, padding, w, h);
      tempCtx.globalCompositeOperation = 'destination-in'; tempCtx.drawImage(maskCanvas, 0, 0);
      ctx.drawImage(tempCanvas, x - padding, y - padding);
    } else {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = w; tempCanvas.height = h;
      createRoundedRectPath(tempCtx, 0, 0, w, h, cornerRadius);
      tempCtx.clip(); tempCtx.drawImage(img, 0, 0, w, h);
      ctx.drawImage(tempCanvas, x, y);
    }
    ctx.restore();
  };

  const drawSelectionHandles = (ctx, layer) => {
    const { x, y, scale, img } = layer;
    const w = img.width * scale; const h = img.height * scale;
    ctx.strokeStyle = HANDLE_COLOR; ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = HANDLE_COLOR;
    const handles = {
      topLeft: { x: x - HANDLE_SIZE / 2, y: y - HANDLE_SIZE / 2 },
      topRight: { x: x + w - HANDLE_SIZE / 2, y: y - HANDLE_SIZE / 2 },
      bottomLeft: { x: x - HANDLE_SIZE / 2, y: y + h - HANDLE_SIZE / 2 },
      bottomRight: { x: x + w - HANDLE_SIZE / 2, y: y + h - HANDLE_SIZE / 2 },
    };
    Object.values(handles).forEach(handle => ctx.fillRect(handle.x, handle.y, HANDLE_SIZE, HANDLE_SIZE));
    return handles;
  };

  const renderCanvas = useCallback(() => {
    const visibleCanvas = visibleCanvasRef.current;
    const bufferCanvas = bufferCanvasRef.current;
    const ctx = bufferCanvas?.getContext('2d');
    if (!visibleCanvas || !bufferCanvas || !ctx || !baseImage) return;

    const baseImg = new Image();
    baseImg.onload = () => {
      if (visibleCanvas.width !== baseImg.width || visibleCanvas.height !== baseImg.height) {
        bufferCanvas.width = visibleCanvas.width = baseImg.width;
        bufferCanvas.height = visibleCanvas.height = baseImg.height;
      }

      ctx.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);

      ctx.save();
      const { blur, brightness, contrast, saturation, hue } = baseImageEffects;
      const filters = [];
      if (blur > 0) filters.push(`blur(${blur}px)`);
      if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
      if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
      if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
      if (hue !== 0) filters.push(`hue-rotate(${hue}deg)`);
      ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';
      ctx.drawImage(baseImg, 0, 0);
      ctx.restore();

      [...layers].reverse().forEach(layer => {
        if (!layer.img) return;
        if (isCropping && layer.id === selectedLayerId) {
          drawLayer(ctx, layer);
          const { x, y, scale, img } = layer;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(x, y, img.width * scale, img.height * scale);
          if (cropBox) {
            ctx.save(); ctx.beginPath(); ctx.rect(cropBox.x, cropBox.y, cropBox.width, cropBox.height); ctx.clip();
            drawLayer(ctx, layer); ctx.restore();
          }
        } else {
          drawLayer(ctx, layer);
        }
      });

      if (isCropping && cropBox) {
        ctx.fillStyle = 'rgba(0, 150, 255, 0.2)'; ctx.strokeStyle = HANDLE_COLOR;
        ctx.lineWidth = 2;
        ctx.fillRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
        ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      }
      if (selectedLayer && !isCropping) drawSelectionHandles(ctx, selectedLayer);

      const visibleCtx = visibleCanvas.getContext('2d');
      visibleCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);
      visibleCtx.drawImage(bufferCanvas, 0, 0);
    };
    baseImg.src = baseImage;
  }, [baseImage, layers, selectedLayer, isCropping, cropBox, baseImageEffects, selectedLayerId]);


  useEffect(() => { renderCanvas() }, [renderCanvas]);

  // --- Interaction Logic ---
  const getMousePos = (e) => {
    const canvas = visibleCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleMouseDown = (e) => {
    const mousePos = getMousePos(e);
    if (isCropping && selectedLayer) {
      interaction.isCropping = true; interaction.startPos = mousePos;
      setCropBox({ x: mousePos.x, y: mousePos.y, width: 0, height: 0 }); return;
    }
    if (selectedLayer) {
      const handles = drawSelectionHandles(bufferCanvasRef.current.getContext('2d'), selectedLayer);
      for (const [pos, handle] of Object.entries(handles)) {
        if (mousePos.x >= handle.x && mousePos.x <= handle.x + HANDLE_SIZE &&
          mousePos.y >= handle.y && mousePos.y <= handle.y + HANDLE_SIZE) {
          interaction.isScaling = true; interaction.activeHandle = pos;
          interaction.startPos = mousePos; interaction.startLayerState = { ...selectedLayer }; return;
        }
      }
    }
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const { x, y, scale, img } = layer;
      const w = img.width * scale, h = img.height * scale;
      if (mousePos.x >= x && mousePos.x <= x + w && mousePos.y >= y && mousePos.y <= y + h) {
        setSelectedLayerId(layer.id);
        interaction.isDragging = true; interaction.startPos = mousePos;
        interaction.startLayerState = { ...layer }; return;
      }
    }
    setSelectedLayerId('base');
  };

  const handleMouseMove = (e) => {
    const mousePos = getMousePos(e);
    if (interaction.isCropping) {
      const { startPos } = interaction;
      setCropBox({
        x: Math.min(mousePos.x, startPos.x), y: Math.min(mousePos.y, startPos.y),
        width: Math.abs(mousePos.x - startPos.x), height: Math.abs(mousePos.y - startPos.y),
      }); return;
    }
    if (!interaction.isDragging && !interaction.isScaling) return;

    const dx = mousePos.x - interaction.startPos.x, dy = mousePos.y - interaction.startPos.y;
    const { startLayerState } = interaction;

    if (interaction.isDragging) {
      updateLayer(startLayerState.id, { x: startLayerState.x + dx, y: startLayerState.y + dy }, { overwrite: true });
    } else if (interaction.isScaling) {
      const { img, x: startX, y: startY, scale: startScale } = startLayerState;
      const startW = img.width * startScale;
      let newW = startW, newX = startX;
      if (interaction.activeHandle.includes('Right')) newW = startW + dx;
      if (interaction.activeHandle.includes('Left')) { newW = startW - dx; newX = startX + dx; }
      if (newW < 10) newW = 10;
      const newScale = newW / img.width;
      let newY = startY;
      if (interaction.activeHandle.includes('Top')) newY = startY - ((img.height * newScale) - (img.height * startScale));
      updateLayer(startLayerState.id, { x: newX, y: newY, scale: newScale }, { overwrite: true });
    }
  };

  const handleMouseUp = () => {
    if (interaction.isDragging) setState(s => s, { actionName: 'Move Layer' });
    if (interaction.isScaling) setState(s => s, { actionName: 'Scale Layer' });
    Object.assign(interaction, { isDragging: false, isScaling: false, isCropping: false, activeHandle: null });
  };

  // --- Layer Drag & Drop Logic ---
  const handleLayerDragStart = (e, id) => {
    setDraggedLayerId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLayerDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetId) return;
    setState(prevState => {
      const newLayers = [...prevState.layers];
      const draggedIndex = newLayers.findIndex(l => l.id === draggedLayerId);
      const targetIndex = newLayers.findIndex(l => l.id === targetId);
      const [draggedItem] = newLayers.splice(draggedIndex, 1);
      newLayers.splice(targetIndex, 0, draggedItem);
      return { ...prevState, layers: newLayers };
    }, { actionName: 'Reorder Layers' });
    setDraggedLayerId(null);
  };

  // --- AI Edit Logic ---
  const handleAiEditClick = () => {
    if (!selectedLayer && selectedLayerId !== 'base') return;

    if (settings.apiKey) {
      setIsAiPromptModalOpen(true);
    } else {
      setIsSettingsModalOpen(true);
      setToastMessage("Please set your Gemini API Key in Settings.");
    }
  };

  const executeAiEdit = async () => {
    const isBase = selectedLayerId === 'base';
    if (!aiPrompt || (!selectedLayer && !isBase)) return;

    // Use the key directly from settings
    const currentApiKey = settings.apiKey;
    if (!currentApiKey) {
      setToastMessage("API Key is missing. Please check Settings.");
      return;
    }

    setIsAiPromptModalOpen(false);
    setIsLoading(true);
    setToastMessage('Sending to AI...');

    try {
      let imageBlob, mimeType = 'image/png';

      if (isBase) {
        const res = await fetch(baseImage);
        imageBlob = await res.blob();
        mimeType = imageBlob.type;
      } else {
        imageBlob = await new Promise(resolve => {
          const { img, scale, feather = 0 } = selectedLayer;
          const canvas = document.createElement('canvas');
          canvas.width = (img.width * scale) + (2 * feather);
          canvas.height = (img.height * scale) + (2 * feather);
          const ctx = canvas.getContext('2d');
          drawLayer(ctx, { ...selectedLayer, x: feather, y: feather });
          canvas.toBlob(resolve, 'image/png');
        });
      }

      const base64ImageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });

      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${currentApiKey}`;
      const requestBody = {
        "contents": [{
          "parts": [
            { "text": aiPrompt },
            { "inline_data": { "mime_type": mimeType, "data": base64ImageData } }
          ]
        }]
      };

      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
      const data = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", data);
        throw new Error(data?.error?.message || `HTTP Error: ${response.status}`);
      }

      if (!data.candidates || data.candidates.length === 0) {
        if (data.promptFeedback && data.promptFeedback.blockReason) {
          throw new Error(`Request blocked: ${data.promptFeedback.blockReason}`);
        }
        throw new Error('API returned no candidates in its response.');
      }

      const candidate = data.candidates[0];
      if (candidate.finishReason && candidate.finishReason !== "STOP") {
        throw new Error(`Generation failed. Reason: ${candidate.finishReason}`);
      }
      if (!candidate.content || !candidate.content.parts) {
        throw new Error('Invalid response: No content parts found.');
      }
      const imagePart = candidate.content.parts.find(p => p.inlineData);
      if (!imagePart) {
        console.error("Invalid API Response:", data);
        const textPart = candidate.content.parts.find(p => p.text);
        throw new Error(textPart ? `AI returned text: "${textPart.text}"` : "AI did not return an image.");
      }

      const newImgDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      if (isBase) {
        setState(prev => ({ ...prev, baseImage: newImgDataUrl }), { actionName: 'AI Edit Base Image' });
      } else {
        const newImg = new Image();
        newImg.onload = () => {
          const oldLayerHeight = selectedLayer.img.height * selectedLayer.scale;
          const newScale = oldLayerHeight / newImg.naturalHeight;
          // --- THIS CALCULATION IS FIXED ---
          // The value is a percentage, so we divide by 100.
          const newFeather = newImg.width * (settings.aiFeatherPercent / 1000);
          updateLayer(selectedLayerId, {
            imageSrc: newImgDataUrl, img: newImg, originalImageSrc: newImgDataUrl, originalImg: newImg,
            scale: isNaN(newScale) ? 1 : newScale, feather: newFeather, featherStart: newFeather * 2.5,
          }, { actionName: 'AI Edit Layer' });
        };
        newImg.src = newImgDataUrl;
      }
      setToastMessage('AI edit successful! ✨');

    } catch (error) {
      console.error("Full AI Edit Error:", error);
      setToastMessage(`AI Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setAiPrompt('');
    }
  };

  // NEW: Handler for keyboard events in AI prompt
  const handleAiPromptKeyDown = (e) => {
    // If Enter is pressed WITHOUT Shift, trigger generation
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent adding a new line
      if (aiPrompt.trim()) { // Check if prompt is not empty
        executeAiEdit();
      }
    }
    // If Shift + Enter is pressed, it will perform its default action (new line)
  };


  // --- Global Listeners & Effects ---
  useEffect(() => { if (!baseImage) setIsModalOpen(true) }, [baseImage]);

  // NEW: Effect to auto-focus the AI prompt input
  useEffect(() => {
    if (isAiPromptModalOpen) {
      // Timeout ensures the element is rendered before we try to focus it
      setTimeout(() => {
        aiPromptInputRef.current?.focus();
      }, 100);
    }
  }, [isAiPromptModalOpen]);

  useEffect(() => {
    const handleGlobalDrop = e => {
      e.preventDefault();
      if (e.dataTransfer.files?.length > 0) handleImageUpload(e.dataTransfer.files[0]);
    };
    const preventDefault = e => e.preventDefault();
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', handleGlobalDrop);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, [baseImage, handleImageUpload]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const isModKey = e.metaKey || e.ctrlKey;
      if (isModKey && e.key === 'z') { e.preventDefault(); e.shiftKey ? handleRedo() : handleUndo(); }
      if (isModKey && e.key === 'd') { e.preventDefault(); if (selectedLayerId) duplicateLayer(selectedLayerId); }
      if (isModKey && e.key === 'e') { e.preventDefault(); handleAiEditClick(); } // AI EDIT SHORTCUT ADDED
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId && selectedLayerId !== 'base') {
        e.preventDefault(); deleteLayer(selectedLayerId);
      }
      if (e.code === 'Space' && !isCropping && selectedLayerId) { e.preventDefault(); toggleCropMode(); }
    };
    const handleKeyUp = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' && isCropping) { e.preventDefault(); toggleCropMode(); }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [selectedLayerId, isCropping, handleUndo, handleRedo, duplicateLayer, deleteLayer, toggleCropMode, handleAiEditClick]);

  const currentSelection = selectedLayerId === 'base' ? { id: 'base', name: baseImageName } : selectedLayer;

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      {isLoading && <LoadingSpinner message={loadingMessage} />}

      {isModalOpen && (
        <Modal title={baseImage ? "Add New Layer" : "Start with a Base Image"} onClose={baseImage ? () => setIsModalOpen(false) : () => { }}>
          <div className="text-center" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleImageUpload(e.dataTransfer.files[0]) }}>
            <p className="text-gray-400 mb-6">Drag & Drop an image file here</p>
            <span className="text-gray-500">or</span>
            <div className="mt-6">
              <label htmlFor="file-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-transform duration-200 ease-in-out hover:scale-105 inline-block">Choose File</label>
              <input id="file-upload" type="file" className="hidden" accept="image/*,.heic,.heif" onChange={(e) => handleImageUpload(e.target.files[0])} />
            </div>
          </div>
        </Modal>
      )}

      {isAiPromptModalOpen && (
        <Modal title="AI Image Edit" onClose={() => setIsAiPromptModalOpen(false)}>
          <textarea
            ref={aiPromptInputRef}
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={handleAiPromptKeyDown}
            placeholder="e.g., make the background a sunny beach"
            rows="3"
            className="w-full bg-gray-700 border border-gray-600 rounded p-2 mb-4 text-white resize-none" />
          <button
            onClick={executeAiEdit}
            disabled={!aiPrompt}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
          >
            Generate <span className={keyHintClass}>Enter</span>
          </button>
        </Modal>
      )}


      {isSettingsModalOpen && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className="w-80 bg-gray-800 p-4 flex flex-col flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Layers</h1>
          <div className="flex items-center space-x-2">
            <button onClick={handleUndo} disabled={!canUndo} className="disabled:text-gray-600 text-gray-400 hover:text-white" title={`Undo (${modKeySymbol} + Z)`}><IconUndo /></button>
            <button onClick={handleRedo} disabled={!canRedo} className="disabled:text-gray-600 text-gray-400 hover:text-white" title={`Redo (${modKeySymbol} + Shift + Z)`}><IconRedo /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-28" onDragOver={e => e.preventDefault()}>
          {[...layers].map((layer) => (
            <div key={layer.id} draggable onDragStart={(e) => handleLayerDragStart(e, layer.id)} onDrop={(e) => handleLayerDrop(e, layer.id)} onClick={() => setSelectedLayerId(layer.id)}
              className={`group cursor-pointer p-2 rounded-md flex items-center justify-between transition-all ${selectedLayerId === layer.id ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
              <div className="flex items-center gap-2 truncate flex-1">
                <span className="cursor-move text-gray-500 group-hover:text-gray-300"><IconDragHandle /></span>
                <span className="truncate">{layer.name}</span>
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }} className="ml-2 text-gray-400 hover:text-white" title={`Duplicate (${modKeySymbol} + D)`}><IconDuplicate /></button>
                <span className={keyHintClass}>{modKeySymbol}D</span>
                <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} className="ml-2 text-gray-400 hover:text-red-500" title="Delete (Del/Backspace)"><IconX /></button>
                <span className={keyHintClass}>Del</span>
              </div>
            </div>
          ))}
          {baseImage && (
            <div onClick={() => setSelectedLayerId('base')}
              className={`group cursor-pointer p-2 mt-4 rounded-md flex items-center justify-between transition-all ${selectedLayerId === 'base' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
              <span className="truncate flex-1">{baseImageName}</span>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); duplicateLayer('base'); }} className="ml-2 text-gray-400 hover:text-white" title={`Duplicate (${modKeySymbol} + D)`}><IconDuplicate /></button>
                <span className={keyHintClass}>{modKeySymbol}D</span>
              </div>
            </div>
          )}
        </div>

        <button onClick={() => setIsModalOpen(true)} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600" disabled={!baseImage}>+ New Layer</button>
        <hr className="border-gray-600 my-4" />

        {currentSelection && (
          <div className="p-2 bg-gray-700 rounded-md overflow-y-auto">
            <input type="text" value={currentSelection.name}
              onChange={(e) => {
                const action = { name: e.target.value };
                const options = { overwrite: true };
                selectedLayerId === 'base' ? setState(prev => ({ ...prev, baseImageName: e.target.value }), options) : updateLayer(currentSelection.id, action, options);
              }}
              onBlur={() => setState(s => s, { actionName: 'Rename' })}
              className="w-full bg-gray-800 border border-gray-600 rounded p-1 mb-3 text-white"
            />

            <CollapsibleSection
              title="Adjustments"
              isOpen={isAdjustmentsOpen}
              onToggle={() => setIsAdjustmentsOpen(!isAdjustmentsOpen)}
            >
              <div className="space-y-3 mb-2">
                <div className="relative">
                  <div className="flex justify-around items-center">
                    {[
                      { id: 'brightness', Icon: IconBrightness }, { id: 'contrast', Icon: IconContrast },
                      { id: 'saturation', Icon: IconSaturation }, { id: 'hue', Icon: IconHue },
                      { id: 'blur', Icon: IconBlur }
                    ].map(({ id, Icon }) => (
                      <button key={id} onClick={() => setActiveEffect(id)} className={`p-2 rounded-md ${activeEffect === id ? 'text-blue-400 bg-gray-900/50' : 'text-gray-400 hover:text-white'}`}>
                        <Icon />
                      </button>
                    ))}
                  </div>
                  <div className="absolute -bottom-3 left-0 w-full h-4 flex items-center">
                    <div style={{ transform: `translateX(${['brightness', 'contrast', 'saturation', 'hue', 'blur'].indexOf(activeEffect) * 100}%)` }}
                      className="w-1/5 h-full flex justify-center items-center transition-transform duration-300 ease-in-out">
                      <span className="text-xs capitalize text-blue-400">{activeEffect}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  {[
                    { id: 'brightness', min: 0, max: 200, unit: '%', value: selectedLayerId === 'base' ? baseImageEffects.brightness : selectedLayer?.brightness },
                    { id: 'contrast', min: 0, max: 200, unit: '%', value: selectedLayerId === 'base' ? baseImageEffects.contrast : selectedLayer?.contrast },
                    { id: 'saturation', min: 0, max: 200, unit: '%', value: selectedLayerId === 'base' ? baseImageEffects.saturation : selectedLayer?.saturation },
                    { id: 'hue', min: -180, max: 180, unit: 'deg', value: selectedLayerId === 'base' ? baseImageEffects.hue : selectedLayer?.hue },
                    { id: 'blur', min: 0, max: 50, unit: 'px', value: selectedLayerId === 'base' ? baseImageEffects.blur : selectedLayer?.blur }
                  ]
                    .filter(s => s.id === activeEffect)
                    .map(slider => (
                      <div key={slider.id}>
                        <div className="flex justify-between items-center text-sm"><label className="text-gray-400 capitalize">{slider.id}</label><span>{slider.value}{slider.unit}</span></div>
                        <input type="range" min={slider.min} max={slider.max} value={slider.value}
                          onChange={e => {
                            const value = parseInt(e.target.value);
                            const update = { [slider.id]: value };
                            if (selectedLayerId === 'base') {
                              setState(prev => ({ ...prev, baseImageEffects: { ...prev.baseImageEffects, ...update } }), { overwrite: true });
                            } else {
                              updateLayer(currentSelection.id, update, { overwrite: true });
                            }
                          }}
                          onMouseUp={() => setState(s => s, { actionName: `Adjust ${slider.id}` })}
                          className="w-full mt-1" />
                      </div>
                    ))}
                </div>
              </div>
            </CollapsibleSection>

            <div className={selectedLayerId === 'base' ? 'opacity-50 pointer-events-none mt-4' : 'mt-4'}>
              <CollapsibleSection
                title="Masking"
                isOpen={isMaskingOpen}
                onToggle={() => setIsMaskingOpen(!isMaskingOpen)}
              >
                <StyledDropdown
                  value={selectedLayer?.blendMode || 'normal'}
                  onChange={e => updateLayer(currentSelection.id, { blendMode: e.target.value }, { actionName: 'Change Blend Mode' })}
                  options={['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity']}
                />
                {[
                  { prop: 'cornerRadius', name: 'Corners', min: 0, max: 200, unit: 'px' },
                  { prop: 'feather', name: 'Feather', min: 0, max: 100, unit: 'px' },
                ].map(({ prop, name, min, max, unit }) => (
                  <div key={prop} className="mt-2">
                    <div className="flex justify-between items-center text-sm"><label className="text-gray-400">{name}</label><span>{selectedLayer?.[prop] || 0}{unit}</span></div>
                    <input type="range" min={min} max={max} value={selectedLayer?.[prop] || 0}
                      onChange={e => {
                        const value = parseInt(e.target.value);
                        const update = { [prop]: value };
                        if (prop === 'feather') update.featherStart = value * 2.5;
                        updateLayer(currentSelection.id, update, { overwrite: true });
                      }}
                      onMouseUp={() => setState(s => s, { actionName: `Adjust ${name}` })}
                      className="w-full mt-1" />
                  </div>
                ))}
              </CollapsibleSection>
            </div>

            <div className="mt-4 space-y-2">
              <button onClick={toggleCropMode} disabled={selectedLayerId === 'base'} className="w-full flex justify-center items-center gap-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-sm py-1 px-2 rounded" title="Toggle crop mode (Space)">Crop <span className={keyHintClass}>space</span></button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleDownloadLayer} className="bg-gray-600 hover:bg-gray-500 text-sm py-1 px-2 rounded">Download</button>
                <button onClick={() => document.getElementById(`replace-${currentSelection.id}`)?.click()} disabled={selectedLayerId === 'base'} className="bg-gray-600 hover:bg-gray-500 text-sm py-1 px-2 rounded disabled:bg-gray-700 disabled:text-gray-500">Replace</button>
                <input id={`replace-${currentSelection.id}`} type="file" className="hidden" accept="image/*,.heic,.heif" onChange={(e) => handleReplaceLayer(e.target.files[0], currentSelection.id)} />
              </div>
              <button onClick={handleAiEditClick} className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-sm py-1.5 px-2 rounded" title={`AI Edit (${modKeySymbol} + E)`}>
                <IconMagic /> AI Edit <span className={keyHintClass}>{modKeySymbol}E</span>
              </button>
            </div>
          </div>
        )}

      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-gray-700 p-4 shadow-md flex justify-between items-center">
          <h2 className="text-xl">Canvas</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-gray-400 hover:text-white"
              title="Settings"
            >
              <IconSettings />
            </button>
            <button onClick={handleDownloadComposition} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Download Image</button>
          </div>
        </header>

        <section className="flex-1 flex items-center justify-center bg-gray-600 overflow-auto p-4">
          {baseImage ? (
            <canvas ref={visibleCanvasRef} className="bg-white shadow-lg max-w-full max-h-full" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
          ) : (
            <div className="border-2 border-dashed border-gray-400 p-12 text-center text-gray-400">Upload a base image to begin</div>
          )}
        </section>
      </main>

      <canvas ref={bufferCanvasRef} style={{ display: 'none' }} />
      {toastMessage && <Toast message={toastMessage} onDone={() => setToastMessage('')} />}
    </div>
  );
}

export default App;
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import type {
  CSSProperties,
  ReactNode,
  PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ReactSketchCanvas,
  type ReactSketchCanvasRef,
  type CanvasPath,
} from 'react-sketch-canvas';
import {
  Pencil,
  Brush,
  Eraser,
  Circle,
  Square,
  Minus,
  Undo2,
  Redo2,
  Trash2,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  Move3d,
  Crosshair,
  Palette,
  Heart,
  Star,
  Shield,
  Sparkles,
} from 'lucide-react';

interface EnhancedCanvasDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (dataUrl: string) => void;
}

type Tool =
  | 'pencil'
  | 'brush'
  | 'eraser'
  | 'move'
  | 'line'
  | 'rectangle'
  | 'circle';
type SymmetryMode = 'none' | 'vertical' | 'horizontal' | 'quad';

type ShapePresetId = 'heart' | 'star' | 'shield' | 'stripes';

interface ShapeGeneratorContext {
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
}

interface ShapePreset {
  id: ShapePresetId;
  label: string;
  icon: ReactNode;
  generator: (ctx: ShapeGeneratorContext) => CanvasPath[];
}

interface CanvasPoint {
  x: number;
  y: number;
}

interface ShapeDraft {
  start: CanvasPoint;
  current: CanvasPoint;
  pointerId: number;
  isDrawing: boolean;
}

type MoveHandle = 'nw' | 'ne' | 'se' | 'sw';

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface MoveOverlayState {
  paths: CanvasPath[];
  bounds: Bounds | null;
  transformMode: 'idle' | 'moving' | 'scaling';
  activePointerId: number | null;
  transformBasePaths: CanvasPath[] | null;
  baseBounds: Bounds | null;
  startPointer: CanvasPoint | null;
  anchorPoint: CanvasPoint | null;
  initialVectorLength: number;
  previewPaths: CanvasPath[] | null;
  previewBounds: Bounds | null;
  handle: MoveHandle | null;
}

const colorPresets = [
  '#000000',
  '#ffffff',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
  '#f97316',
  '#0ea5e9',
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const waitForAnimationFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const clonePaths = (paths: CanvasPath[]): CanvasPath[] =>
  paths.map((path) => ({
    ...path,
    paths: path.paths.map((point) => ({ x: point.x, y: point.y })),
  }));

const computeBounds = (paths: CanvasPath[]): Bounds | null => {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  paths.forEach((path) => {
    path.paths.forEach((point) => {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    });
  });

  if (
    minX === Number.POSITIVE_INFINITY ||
    minY === Number.POSITIVE_INFINITY ||
    maxX === Number.NEGATIVE_INFINITY ||
    maxY === Number.NEGATIVE_INFINITY
  ) {
    return null;
  }

  return { minX, minY, maxX, maxY };
};

const translatePaths = (
  paths: CanvasPath[],
  dx: number,
  dy: number
): CanvasPath[] =>
  paths.map((path) => ({
    ...path,
    paths: path.paths.map((point) => ({
      x: point.x + dx,
      y: point.y + dy,
    })),
  }));

const translateBounds = (bounds: Bounds | null, dx: number, dy: number): Bounds | null =>
  bounds
    ? {
        minX: bounds.minX + dx,
        minY: bounds.minY + dy,
        maxX: bounds.maxX + dx,
        maxY: bounds.maxY + dy,
      }
    : null;

const scalePaths = (
  paths: CanvasPath[],
  anchor: CanvasPoint,
  scale: number
): CanvasPath[] =>
  paths.map((path) => ({
    ...path,
    paths: path.paths.map((point) => ({
      x: anchor.x + (point.x - anchor.x) * scale,
      y: anchor.y + (point.y - anchor.y) * scale,
    })),
  }));

const scaleBounds = (
  bounds: Bounds | null,
  anchor: CanvasPoint,
  scale: number
): Bounds | null => {
  if (!bounds) return null;
  const corners = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.maxY },
    { x: bounds.maxX, y: bounds.minY },
  ].map((point) => ({
    x: anchor.x + (point.x - anchor.x) * scale,
    y: anchor.y + (point.y - anchor.y) * scale,
  }));

  return {
    minX: Math.min(...corners.map((p) => p.x)),
    minY: Math.min(...corners.map((p) => p.y)),
    maxX: Math.max(...corners.map((p) => p.x)),
    maxY: Math.max(...corners.map((p) => p.y)),
  };
};

const pointInBounds = (point: CanvasPoint, bounds: Bounds | null): boolean =>
  !!bounds &&
  point.x >= bounds.minX &&
  point.x <= bounds.maxX &&
  point.y >= bounds.minY &&
  point.y <= bounds.maxY;

const pathToSvgD = (path: CanvasPath): string => {
  if (!path.paths.length) return '';
  const [first, ...rest] = path.paths;
  const segments = rest.map((point) => `L ${point.x} ${point.y}`).join(' ');
  return `M ${first.x} ${first.y} ${segments}`;
};

const hexToRgba = (hex: string, opacity: number) => {
  if (!hex.startsWith('#')) {
    return hex;
  }

  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const intValue = parseInt(normalized, 16);
  const r = (intValue >> 16) & 255;
  const g = (intValue >> 8) & 255;
  const b = intValue & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const createCanvasPathFromPoints = (
  points: CanvasPoint[],
  color: string,
  strokeWidth: number,
  closeShape = false
): CanvasPath => {
  const finalPoints =
    closeShape && points.length > 0
      ? [...points, points[0]]
      : [...points];

  return {
    paths: finalPoints.map(({ x, y }) => ({ x, y })),
    strokeColor: color,
    strokeWidth,
    drawMode: true,
  };
};

const generateStarPath = (ctx: ShapeGeneratorContext): CanvasPath[] => {
  const { width, height, color, strokeWidth } = ctx;
  const size = Math.min(width, height) * 0.32;
  const center: CanvasPoint = {
    x: width / 2,
    y: height / 2 - height * 0.05,
  };
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.45;
  const points: CanvasPoint[] = [];
  const step = Math.PI / spikes;

  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  }

  return [
    createCanvasPathFromPoints(points, color, strokeWidth * 1.1, true),
  ];
};

const generateHeartPath = (ctx: ShapeGeneratorContext): CanvasPath[] => {
  const { width, height, color, strokeWidth } = ctx;
  const scale = Math.min(width, height) * 0.045;
  const center: CanvasPoint = {
    x: width / 2,
    y: height / 2,
  };
  const points: CanvasPoint[] = [];
  const samples = 80;

  for (let i = 0; i <= samples; i++) {
    const t = (Math.PI * 2 * i) / samples;
    const x =
      16 * Math.pow(Math.sin(t), 3) * scale + center.x;
    const y =
      (-13 * Math.cos(t) +
        5 * Math.cos(2 * t) +
        2 * Math.cos(3 * t) +
        Math.cos(4 * t)) *
        scale +
      center.y;
    points.push({ x, y });
  }

  return [
    createCanvasPathFromPoints(points, color, Math.max(strokeWidth, 6), true),
  ];
};

const generateShieldPath = (ctx: ShapeGeneratorContext): CanvasPath[] => {
  const { width, height, color, strokeWidth } = ctx;
  const w = Math.min(width, height) * 0.45;
  const h = Math.min(width, height) * 0.55;
  const center: CanvasPoint = {
    x: width / 2,
    y: height / 2,
  };

  const points: CanvasPoint[] = [
    { x: center.x, y: center.y - h * 0.75 },
    { x: center.x + w * 0.45, y: center.y - h * 0.35 },
    { x: center.x + w * 0.35, y: center.y + h * 0.2 },
    { x: center.x, y: center.y + h * 0.75 },
    { x: center.x - w * 0.35, y: center.y + h * 0.2 },
    { x: center.x - w * 0.45, y: center.y - h * 0.35 },
  ];

  return [
    createCanvasPathFromPoints(points, color, strokeWidth * 1.05, true),
  ];
};

const generateStripePaths = (ctx: ShapeGeneratorContext): CanvasPath[] => {
  const { width, height, color, strokeWidth } = ctx;
  const stripeWidth = Math.max(strokeWidth * 2, 10);
  const startX = width * 0.18;
  const endX = width * 0.82;
  const midY = height * 0.42;
  const spacing = stripeWidth * 1.7;
  const offsets = [-spacing, 0, spacing];

  return offsets.map((offset) =>
    createCanvasPathFromPoints(
      [
        { x: startX, y: midY + offset },
        { x: endX, y: midY + offset },
      ],
      color,
      stripeWidth,
      false
    )
  );
};

const SHAPE_LIBRARY: ShapePreset[] = [
  {
    id: 'heart',
    label: 'Heart',
    icon: <Heart className="w-4 h-4" />,
    generator: generateHeartPath,
  },
  {
    id: 'star',
    label: 'Star',
    icon: <Star className="w-4 h-4" />,
    generator: generateStarPath,
  },
  {
    id: 'shield',
    label: 'Shield',
    icon: <Shield className="w-4 h-4" />,
    generator: generateShieldPath,
  },
  {
    id: 'stripes',
    label: 'Stripes',
    icon: <Minus className="w-4 h-4 rotate-90" />,
    generator: generateStripePaths,
  },
];

const isShapeTool = (tool: Tool) =>
  tool === 'line' || tool === 'rectangle' || tool === 'circle';

const EnhancedCanvasDesigner = ({
  isOpen,
  onClose,
  onExport,
}: EnhancedCanvasDesignerProps) => {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const shapeOverlayRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>('pencil');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeOpacity, setStrokeOpacity] = useState(1);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [eraserWidth, setEraserWidth] = useState(10);
  const [canvasColor, setCanvasColor] = useState('#ffffff');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [symmetryMode, setSymmetryMode] =
    useState<SymmetryMode>('none');
  const [showGuides, setShowGuides] = useState(true);
  const [shapeDraft, setShapeDraft] = useState<ShapeDraft | null>(
    null
  );
  const [moveState, setMoveState] = useState<MoveOverlayState | null>(null);

  const refreshMoveState = useCallback(async () => {
    if (!canvasRef.current) return;
    await waitForAnimationFrame();
    const exported = await canvasRef.current.exportPaths();
    const snapshot = clonePaths(exported ?? []);
    setMoveState({
      paths: snapshot,
      bounds: computeBounds(snapshot),
      transformMode: 'idle',
      activePointerId: null,
      transformBasePaths: null,
      baseBounds: null,
      startPointer: null,
      anchorPoint: null,
      initialVectorLength: 0,
      previewPaths: null,
      previewBounds: null,
      handle: null,
    });
  }, []);

  const commitTransformedPaths = useCallback(
    async (paths: CanvasPath[]) => {
      if (!canvasRef.current) return;
      canvasRef.current.clearCanvas();
      canvasRef.current.loadPaths(clonePaths(paths));
      await refreshMoveState();
    },
    [refreshMoveState]
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.eraseMode(tool === 'eraser');
  }, [tool]);

  useEffect(() => {
    if (tool === 'move') {
      void refreshMoveState();
    } else {
      setMoveState(null);
    }
  }, [tool, refreshMoveState]);

  useEffect(() => {
    if (!isOpen) {
      setShapeDraft(null);
      return;
    }
    setTimeout(() => {
      if (!canvasWrapperRef.current) return;
      const rect = canvasWrapperRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        setZoomLevel(1);
      }
    }, 0);
  }, [isOpen]);

  const effectiveStrokeColor = useMemo(
    () => hexToRgba(strokeColor, strokeOpacity),
    [strokeColor, strokeOpacity]
  );

  const canvasBackgroundStyle = useMemo<CSSProperties>(() => {
    if (canvasColor === 'transparent') {
      return {
        backgroundImage:
          'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
        backgroundSize: '24px 24px',
        backgroundPosition:
          '0 0, 0 12px, 12px -12px, -12px 0px',
        backgroundColor: '#f9fafb',
      };
    }
    return { backgroundColor: canvasColor };
  }, [canvasColor]);

  const getCanvasSize = useCallback(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return null;
    const rect = wrapper.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, []);

  const mirrorPath = useCallback(
    (
      path: CanvasPath,
      size: { width: number; height: number },
      mirrorX: boolean,
      mirrorY: boolean
    ): CanvasPath => ({
      ...path,
      paths: path.paths.map((point) => ({
        x: mirrorX ? size.width - point.x : point.x,
        y: mirrorY ? size.height - point.y : point.y,
      })),
    }),
    []
  );

  const appendSymmetry = useCallback(
    (paths: CanvasPath[], includeOriginal = true) => {
      if (symmetryMode === 'none') {
        return includeOriginal ? paths : [];
      }

      const size = getCanvasSize();
      if (!size || size.width === 0 || size.height === 0) {
        return includeOriginal ? paths : [];
      }

      const mirrored = paths.flatMap((path) => {
        const copies: CanvasPath[] = [];

        if (symmetryMode === 'vertical' || symmetryMode === 'quad') {
          copies.push(mirrorPath(path, size, true, false));
        }

        if (symmetryMode === 'horizontal' || symmetryMode === 'quad') {
          copies.push(mirrorPath(path, size, false, true));
        }

        if (symmetryMode === 'quad') {
          copies.push(mirrorPath(path, size, true, true));
        }

        return copies;
      });

      return includeOriginal ? [...paths, ...mirrored] : mirrored;
    },
    [getCanvasSize, mirrorPath, symmetryMode]
  );

  const handleStroke = useCallback(
    (path: CanvasPath) => {
      const mirrored = appendSymmetry([path], false);
      if (mirrored.length && canvasRef.current) {
        canvasRef.current.loadPaths(mirrored);
      }
    },
    [appendSymmetry]
  );

  const handleExport = async () => {
    if (!canvasRef.current) return;
    const dataUrl = await canvasRef.current.exportImage('png');
    onExport(dataUrl);
    onClose();
  };

  const handleUndo = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.undo();
    if (tool === 'move') {
      await refreshMoveState();
    }
  };

  const handleRedo = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.redo();
    if (tool === 'move') {
      await refreshMoveState();
    }
  };

  const handleClear = () => {
    if (confirm('Clear the canvas? This action cannot be undone.')) {
      canvasRef.current?.clearCanvas();
      setShapeDraft(null);
      if (tool === 'move') {
        void refreshMoveState();
      }
    }
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    const dataUrl = await canvasRef.current.exportImage('png');
    const link = document.createElement('a');
    link.download = 'my-design.png';
    link.href = dataUrl;
    link.click();
  };

  const handleAddPreset = (presetId: ShapePresetId) => {
    if (!canvasRef.current) return;
    const size = getCanvasSize();
    if (!size) return;

    const preset = SHAPE_LIBRARY.find((p) => p.id === presetId);
    if (!preset) return;

    const basePaths = preset.generator({
      width: size.width,
      height: size.height,
      color: effectiveStrokeColor,
      strokeWidth,
    });

    if (!basePaths.length) return;

    const pathsToLoad = appendSymmetry(basePaths, true);
    canvasRef.current.loadPaths(pathsToLoad);
    if (tool === 'move') {
      void refreshMoveState();
    }
  };

  const createShapeToolPath = (
    type: Tool,
    start: CanvasPoint,
    end: CanvasPoint
  ): CanvasPath | null => {
    const deltaX = Math.abs(end.x - start.x);
    const deltaY = Math.abs(end.y - start.y);
    if (deltaX < 2 && deltaY < 2) return null;

    if (type === 'line') {
      return createCanvasPathFromPoints(
        [start, end],
        effectiveStrokeColor,
        strokeWidth,
        false
      );
    }

    if (type === 'rectangle') {
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);
      const points: CanvasPoint[] = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ];
      return createCanvasPathFromPoints(
        points,
        effectiveStrokeColor,
        strokeWidth,
        true
      );
    }

    if (type === 'circle') {
      const centerX = (start.x + end.x) / 2;
      const centerY = (start.y + end.y) / 2;
      const radius =
        Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
      if (radius < 2) return null;

      const segments = 64;
      const points: CanvasPoint[] = [];
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        });
      }

      return createCanvasPathFromPoints(
        points,
        effectiveStrokeColor,
        strokeWidth,
        true
      );
    }

    return null;
  };

  const getOverlayPointer = (
    event: ReactPointerEvent<HTMLDivElement>
  ): CanvasPoint => {
    const overlay = shapeOverlayRef.current;
    if (!overlay) return { x: 0, y: 0 };
    const bounds = overlay.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  };

  const handleShapePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (!isShapeTool(tool) || !shapeOverlayRef.current) return;

    const startPoint = getOverlayPointer(event);

    event.preventDefault();
    shapeOverlayRef.current.setPointerCapture(event.pointerId);
    setShapeDraft({
      start: startPoint,
      current: startPoint,
      pointerId: event.pointerId,
      isDrawing: true,
    });
  };

  const handleShapePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (!shapeDraft || !shapeDraft.isDrawing || !shapeOverlayRef.current) return;

    const nextPoint = getOverlayPointer(event);

    event.preventDefault();
    setShapeDraft((draft) =>
      draft
        ? {
            ...draft,
            current: nextPoint,
          }
        : draft
    );
  };

  const finalizeShapeDraft = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (!shapeDraft || !shapeOverlayRef.current) return;

    const endPoint = getOverlayPointer(event);

    if (shapeOverlayRef.current.hasPointerCapture(shapeDraft.pointerId)) {
      shapeOverlayRef.current.releasePointerCapture(shapeDraft.pointerId);
    }

    setShapeDraft(null);

    const shapePath = createShapeToolPath(tool, shapeDraft.start, endPoint);
    if (shapePath && canvasRef.current) {
      const toLoad = appendSymmetry([shapePath], true);
      canvasRef.current.loadPaths(toLoad);
    }
  };

  const handleShapePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isShapeTool(tool)) return;
    event.preventDefault();
    finalizeShapeDraft(event);
  };

  const handleShapePointerCancel = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (!isShapeTool(tool)) return;
    event.preventDefault();
    finalizeShapeDraft(event);
  };

  const resetMoveInteraction = () => {
    setMoveState((prev) =>
      prev
        ? {
            ...prev,
            transformMode: 'idle',
            activePointerId: null,
            transformBasePaths: null,
            baseBounds: null,
            startPointer: null,
            anchorPoint: null,
            initialVectorLength: 0,
            previewPaths: null,
            previewBounds: null,
            handle: null,
          }
        : prev
    );
  };

  const moveHandles: MoveHandle[] = ['nw', 'ne', 'se', 'sw'];
  const handleCursors: Record<MoveHandle, string> = {
    nw: 'nwse-resize',
    se: 'nwse-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
  };

  const getAnchorForHandle = (handle: MoveHandle, bounds: Bounds): CanvasPoint => {
    switch (handle) {
      case 'nw':
        return { x: bounds.maxX, y: bounds.maxY };
      case 'ne':
        return { x: bounds.minX, y: bounds.maxY };
      case 'se':
        return { x: bounds.minX, y: bounds.minY };
      case 'sw':
      default:
        return { x: bounds.maxX, y: bounds.minY };
    }
  };

  const handleMovePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (tool !== 'move' || !moveState || !moveState.paths.length || !shapeOverlayRef.current) {
      return;
    }

    if (moveState.transformMode !== 'idle') {
      return;
    }

    const pointer = getOverlayPointer(event);
    const activeBounds = moveState.previewBounds ?? moveState.bounds;

    if (!pointInBounds(pointer, activeBounds)) {
      return;
    }

    event.preventDefault();
    shapeOverlayRef.current.setPointerCapture(event.pointerId);
    setMoveState((prev) =>
      prev
        ? {
            ...prev,
            transformMode: 'moving',
            activePointerId: event.pointerId,
            transformBasePaths: clonePaths(prev.previewPaths ?? prev.paths),
            baseBounds: prev.previewBounds ?? prev.bounds,
            startPointer: pointer,
            previewPaths: clonePaths(prev.previewPaths ?? prev.paths),
            previewBounds: prev.previewBounds ?? prev.bounds,
            handle: null,
          }
        : prev
    );
  };

  const handleScalePointerDown = (
    handle: MoveHandle,
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (
      tool !== 'move' ||
      !moveState ||
      !moveState.paths.length ||
      !shapeOverlayRef.current
    ) {
      return;
    }

    if (moveState.transformMode !== 'idle') {
      return;
    }

    const baseBounds = moveState.previewBounds ?? moveState.bounds;
    if (!baseBounds) return;

    const anchor = getAnchorForHandle(handle, baseBounds);
    const pointer = getOverlayPointer(event);
    const vector = {
      x: pointer.x - anchor.x,
      y: pointer.y - anchor.y,
    };
    const length = Math.hypot(vector.x, vector.y);
    if (length < 1) return;

    event.preventDefault();
    event.stopPropagation();
    shapeOverlayRef.current.setPointerCapture(event.pointerId);
    setMoveState((prev) =>
      prev
        ? {
            ...prev,
            transformMode: 'scaling',
            activePointerId: event.pointerId,
            transformBasePaths: clonePaths(prev.previewPaths ?? prev.paths),
            baseBounds,
            startPointer: pointer,
            anchorPoint: anchor,
            initialVectorLength: length,
            previewPaths: clonePaths(prev.previewPaths ?? prev.paths),
            previewBounds: baseBounds,
            handle,
          }
        : prev
    );
  };

  const handleMovePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (tool !== 'move' || !moveState || moveState.transformMode === 'idle') {
      return;
    }

    if (moveState.activePointerId !== null && event.pointerId !== moveState.activePointerId) {
      return;
    }

    const pointer = getOverlayPointer(event);

    if (
      moveState.transformMode === 'moving' &&
      moveState.transformBasePaths &&
      moveState.startPointer
    ) {
      const dx = pointer.x - moveState.startPointer.x;
      const dy = pointer.y - moveState.startPointer.y;
      setMoveState((prev) =>
        prev && prev.transformMode === 'moving' && prev.transformBasePaths
          ? {
              ...prev,
              previewPaths: translatePaths(prev.transformBasePaths, dx, dy),
              previewBounds: translateBounds(prev.baseBounds ?? prev.bounds, dx, dy),
            }
          : prev
      );
    }

    if (
      moveState.transformMode === 'scaling' &&
      moveState.transformBasePaths &&
      moveState.anchorPoint
    ) {
      const vector = {
        x: pointer.x - moveState.anchorPoint.x,
        y: pointer.y - moveState.anchorPoint.y,
      };
      const length = Math.hypot(vector.x, vector.y);
      if (length < 1) return;
      const scaleFactor = clamp(
        length / (moveState.initialVectorLength || 1),
        0.2,
        5
      );
      setMoveState((prev) =>
        prev && prev.transformMode === 'scaling' && prev.transformBasePaths && prev.anchorPoint
          ? {
              ...prev,
              previewPaths: scalePaths(prev.transformBasePaths, prev.anchorPoint, scaleFactor),
              previewBounds: scaleBounds(prev.baseBounds ?? prev.bounds, prev.anchorPoint, scaleFactor),
            }
          : prev
      );
    }
  };

  const releaseMovePointer = () => {
    if (moveState?.activePointerId !== null && shapeOverlayRef.current?.hasPointerCapture(moveState.activePointerId)) {
      shapeOverlayRef.current.releasePointerCapture(moveState.activePointerId);
    }
  };

  const handleMovePointerFinalize = async (
    event: ReactPointerEvent<HTMLDivElement>,
    cancelled = false
  ) => {
    if (tool !== 'move' || !moveState) return;

    releaseMovePointer();

    if (cancelled || moveState.transformMode === 'idle') {
      resetMoveInteraction();
      return;
    }

    const pointer = getOverlayPointer(event);

    if (
      moveState.transformMode === 'moving' &&
      moveState.transformBasePaths &&
      moveState.startPointer
    ) {
      const dx = pointer.x - moveState.startPointer.x;
      const dy = pointer.y - moveState.startPointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0.5) {
        const newPaths = translatePaths(moveState.transformBasePaths, dx, dy);
        resetMoveInteraction();
        await commitTransformedPaths(newPaths);
        return;
      }
    }

    if (
      moveState.transformMode === 'scaling' &&
      moveState.transformBasePaths &&
      moveState.anchorPoint
    ) {
      const vector = {
        x: pointer.x - moveState.anchorPoint.x,
        y: pointer.y - moveState.anchorPoint.y,
      };
      const length = Math.hypot(vector.x, vector.y);
      if (length > 1) {
        const scaleFactor = clamp(
          length / (moveState.initialVectorLength || 1),
          0.2,
          5
        );
        const newPaths = scalePaths(moveState.transformBasePaths, moveState.anchorPoint, scaleFactor);
        resetMoveInteraction();
        await commitTransformedPaths(newPaths);
        return;
      }
    }

    resetMoveInteraction();
  };

  const handleMovePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    void handleMovePointerFinalize(event, false);
  };

  const handleMovePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    void handleMovePointerFinalize(event, true);
  };

  const isMoveToolActive = tool === 'move';
  const activeMoveBounds = moveState?.previewBounds ?? moveState?.bounds;
  const movePreviewPaths = moveState?.previewPaths;
  const isMoveTransforming =
    isMoveToolActive && moveState?.transformMode !== 'idle';
  const canvasOverlayOpacity =
    isMoveTransforming && movePreviewPaths ? 0.25 : 1;

  const handleZoomIn = () => {
    setZoomLevel((prev) => clamp(prev + 0.15, 0.6, 2.2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => clamp(prev - 0.15, 0.6, 2.2));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 p-3 md:p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white md:text-2xl">
            <Palette className="h-6 w-6" />
            Canvas Designer
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg bg-red-600 px-3 py-2 text-white transition hover:bg-red-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="border-b border-gray-700 bg-gray-900 p-3 md:border-b-0 md:border-r md:p-4">
          <div className="flex min-w-max gap-2 md:min-w-0 md:flex-col">
            <div className="flex gap-2 border-b border-gray-700 pb-3 md:mb-3 md:flex-col md:border-b-0 md:pb-0">
              <ToolButton
                icon={<Move3d />}
                label="Move"
                active={tool === 'move'}
                onClick={() => setTool('move')}
              />
              <ToolButton
                icon={<Pencil />}
                label="Pencil"
                active={tool === 'pencil'}
                onClick={() => setTool('pencil')}
              />
              <ToolButton
                icon={<Brush />}
                label="Brush"
                active={tool === 'brush'}
                onClick={() => setTool('brush')}
              />
              <ToolButton
                icon={<Eraser />}
                label="Eraser"
                active={tool === 'eraser'}
                onClick={() => setTool('eraser')}
              />
            </div>

            <div className="flex gap-2 border-b border-gray-700 pb-3 md:mb-3 md:flex-col md:border-b-0 md:pb-0">
              <ToolButton
                icon={<Minus />}
                label="Line"
                active={tool === 'line'}
                onClick={() => setTool('line')}
              />
              <ToolButton
                icon={<Square />}
                label="Rectangle"
                active={tool === 'rectangle'}
                onClick={() => setTool('rectangle')}
              />
              <ToolButton
                icon={<Circle />}
                label="Circle"
                active={tool === 'circle'}
                onClick={() => setTool('circle')}
              />
            </div>

            <div className="flex gap-2 border-b border-gray-700 pb-3 md:mb-3 md:flex-col md:border-b-0 md:pb-0">
              <ToolButton icon={<Undo2 />} label="Undo" onClick={handleUndo} />
              <ToolButton icon={<Redo2 />} label="Redo" onClick={handleRedo} />
              <ToolButton
                icon={<Trash2 />}
                label="Clear"
                onClick={handleClear}
                className="bg-red-600/20 hover:bg-red-600/40"
              />
            </div>

            <div className="flex gap-2 md:flex-col">
              <ToolButton
                icon={<Download />}
                label="Download"
                onClick={handleDownload}
                className="bg-green-600/20 hover:bg-green-600/40"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto bg-gray-900 p-4">
              <div className="flex min-h-[420px] w-full items-center justify-center">
                <div
                  className="relative w-full max-w-4xl overflow-hidden rounded-lg border-2 border-gray-700 shadow-2xl aspect-square"
                  style={canvasBackgroundStyle}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      ref={canvasWrapperRef}
                      className="relative h-full w-full"
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'center center',
                      }}
                    >
                      <ReactSketchCanvas
                        ref={canvasRef}
                        strokeWidth={strokeWidth}
                        eraserWidth={eraserWidth}
                        strokeColor={effectiveStrokeColor}
                      canvasColor={canvasColor}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: '2px solid #374151',
                        borderRadius: '0.5rem',
                        background: 'transparent',
                        opacity: canvasOverlayOpacity,
                      }}
                        exportWithBackgroundImage={true}
                        preserveBackgroundImageAspectRatio="xMidYMid meet"
                        onStroke={handleStroke}
                        width="100%"
                        height="100%"
                      />

                      {showGuides && (
                        <div className="pointer-events-none absolute inset-0 z-30">
                          <div className="absolute inset-[12%] rounded-xl border-2 border-dashed border-indigo-400/70" />
                          <div className="absolute left-1/2 top-0 bottom-0 border-l border-white/40 border-dashed" />
                          <div className="absolute left-0 right-0 top-1/2 border-t border-white/30 border-dashed" />
                          <div className="absolute left-[20%] right-[20%] top-[30%] h-[4%] rounded-full bg-white/10" />
                        </div>
                      )}

                      <div
                        ref={shapeOverlayRef}
                        className="absolute inset-0 z-40"
                        style={{
                          cursor: isMoveToolActive
                            ? 'move'
                            : isShapeTool(tool)
                            ? 'crosshair'
                            : 'default',
                          pointerEvents:
                            isMoveToolActive || isShapeTool(tool) ? 'auto' : 'none',
                        }}
                        onPointerDown={(event) => {
                          if (isMoveToolActive) {
                            handleMovePointerDown(event);
                          } else if (isShapeTool(tool)) {
                            handleShapePointerDown(event);
                          }
                        }}
                        onPointerMove={(event) => {
                          if (isMoveToolActive) {
                            handleMovePointerMove(event);
                          } else if (isShapeTool(tool)) {
                            handleShapePointerMove(event);
                          }
                        }}
                        onPointerUp={(event) => {
                          if (isMoveToolActive) {
                            handleMovePointerUp(event);
                          } else if (isShapeTool(tool)) {
                            handleShapePointerUp(event);
                          }
                        }}
                        onPointerCancel={(event) => {
                          if (isMoveToolActive) {
                            handleMovePointerCancel(event);
                          } else if (isShapeTool(tool)) {
                            handleShapePointerCancel(event);
                          }
                        }}
                      >
                        {shapeDraft && isShapeTool(tool) && (
                          <svg className="pointer-events-none absolute inset-0 h-full w-full">
                            {tool === 'line' && (
                              <line
                                x1={shapeDraft.start.x}
                                y1={shapeDraft.start.y}
                                x2={shapeDraft.current.x}
                                y2={shapeDraft.current.y}
                                stroke="#818cf8"
                                strokeWidth={2}
                                strokeDasharray="6 4"
                              />
                            )}
                            {tool === 'rectangle' && (
                              <rect
                                x={Math.min(shapeDraft.start.x, shapeDraft.current.x)}
                                y={Math.min(shapeDraft.start.y, shapeDraft.current.y)}
                                width={Math.abs(shapeDraft.current.x - shapeDraft.start.x)}
                                height={Math.abs(shapeDraft.current.y - shapeDraft.start.y)}
                                stroke="#818cf8"
                                strokeWidth={2}
                                strokeDasharray="8 6"
                                fill="none"
                              />
                            )}
                            {tool === 'circle' && (
                              <circle
                                cx={(shapeDraft.start.x + shapeDraft.current.x) / 2}
                                cy={(shapeDraft.start.y + shapeDraft.current.y) / 2}
                                r={
                                  Math.max(
                                    Math.abs(shapeDraft.current.x - shapeDraft.start.x),
                                    Math.abs(shapeDraft.current.y - shapeDraft.start.y)
                                  ) / 2
                                }
                                stroke="#818cf8"
                                strokeWidth={2}
                                strokeDasharray="8 6"
                                fill="none"
                              />
                            )}
                          </svg>
                        )}

                        {isMoveToolActive && activeMoveBounds && (
                          <>
                            {isMoveTransforming && movePreviewPaths && (
                              <svg className="pointer-events-none absolute inset-0 h-full w-full">
                                {movePreviewPaths.map((path, index) => {
                                  const d = pathToSvgD(path);
                                  if (!d) return null;
                                  return (
                                    <path
                                      key={index}
                                      d={d}
                                      fill="none"
                                      stroke={
                                        path.drawMode
                                          ? path.strokeColor
                                          : 'rgba(255,255,255,0.6)'
                                      }
                                      strokeWidth={path.strokeWidth}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      opacity={0.9}
                                    />
                                  );
                                })}
                              </svg>
                            )}

                            <div
                              className={`pointer-events-none absolute rounded border-2 ${
                                isMoveTransforming
                                  ? 'border-indigo-300/80 bg-indigo-500/10'
                                  : 'border-indigo-400/80'
                              }`}
                              style={{
                                left: activeMoveBounds.minX,
                                top: activeMoveBounds.minY,
                                width: Math.max(
                                  activeMoveBounds.maxX - activeMoveBounds.minX,
                                  0
                                ),
                                height: Math.max(
                                  activeMoveBounds.maxY - activeMoveBounds.minY,
                                  0
                                ),
                              }}
                            />

                            {moveHandles.map((handle) => {
                              const left =
                                handle === 'nw' || handle === 'sw'
                                  ? activeMoveBounds.minX
                                  : activeMoveBounds.maxX;
                              const top =
                                handle === 'nw' || handle === 'ne'
                                  ? activeMoveBounds.minY
                                  : activeMoveBounds.maxY;
                              return (
                                <div
                                  key={handle}
                                  onPointerDown={(event) => handleScalePointerDown(handle, event)}
                                  className="absolute h-3 w-3 rounded-sm border border-white bg-indigo-500 shadow"
                                  style={{
                                    left,
                                    top,
                                    transform: 'translate(-50%, -50%)',
                                    cursor: handleCursors[handle],
                                  }}
                                />
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 bg-gray-800 p-4">
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700"
                >
                  <Download className="h-5 w-5" />
                  Apply to T-Shirt
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-gray-700 px-6 py-3 font-semibold text-white transition hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
              <p className="mt-3 text-center text-sm text-gray-400">
                Mirror modes, guided shapes, and T-shirt stamps make it easy to craft
                balanced artwork. Apply when you are happy with the design!
              </p>
            </div>

          </div>

          <aside className="w-full flex-shrink-0 border-t border-gray-700 bg-gray-800 md:w-80 md:border-t-0 md:border-l">
            <div className="h-full overflow-y-auto space-y-4 p-3 md:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm font-medium text-white">
                  Brush Color:
                </label>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(event) => setStrokeColor(event.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border-2 border-gray-600"
                />
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    onClick={() => setStrokeColor(color)}
                    className={`h-8 w-8 rounded border-2 transition hover:scale-110 ${
                      strokeColor === color
                        ? 'border-white ring-2 ring-indigo-500'
                        : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-white">
                  {tool === 'eraser' ? 'Eraser Size:' : 'Stroke Width:'}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="80"
                    value={tool === 'eraser' ? eraserWidth : strokeWidth}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (tool === 'eraser') {
                        setEraserWidth(value);
                      } else {
                        setStrokeWidth(value);
                      }
                    }}
                    className="flex-1"
                  />
                  <span className="w-12 text-right text-sm font-medium text-white">
                    {tool === 'eraser' ? eraserWidth : strokeWidth}px
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-white">
                  Stroke Opacity:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={strokeOpacity}
                    onChange={(event) =>
                      setStrokeOpacity(Number(event.target.value))
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-right text-sm font-medium text-white">
                    {Math.round(strokeOpacity * 100)}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-white">
                  Background:
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={canvasColor === 'transparent' ? '#ffffff' : canvasColor}
                    onChange={(event) =>
                      setCanvasColor(event.target.value || '#ffffff')
                    }
                    className="h-10 w-10 cursor-pointer rounded border-2 border-gray-600"
                  />
                  <button
                    onClick={() => setCanvasColor('#ffffff')}
                    className="rounded bg-gray-700 px-3 py-1 text-sm text-white transition hover:bg-gray-600"
                  >
                    White
                  </button>
                  <button
                    onClick={() => setCanvasColor('transparent')}
                    className="rounded bg-gray-700 px-3 py-1 text-sm text-white transition hover:bg-gray-600"
                  >
                    Transparent
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-1 text-sm font-medium text-white">
                  <Sparkles className="h-4 w-4" />
                  Symmetry:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'none', label: 'Off' },
                    { value: 'vertical', label: 'Mirror L/R' },
                    { value: 'horizontal', label: 'Mirror Up/Down' },
                    { value: 'quad', label: 'Quad' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setSymmetryMode(option.value as SymmetryMode)
                      }
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        symmetryMode === option.value
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-white">
                  Guides & Zoom:
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowGuides((prev) => !prev)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      showGuides
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {showGuides ? 'Hide Guides' : 'Show Guides'}
                  </button>
                  <div className="flex items-center gap-2 rounded-lg bg-gray-900 px-2 py-1">
                    <button
                      onClick={handleZoomOut}
                      className="rounded bg-gray-800 p-1 text-gray-300 transition hover:bg-gray-700"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="min-w-[3rem] text-center text-sm text-white">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="rounded bg-gray-800 p-1 text-gray-300 transition hover:bg-gray-700"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleZoomReset}
                      className="rounded bg-gray-800 p-1 text-gray-300 transition hover:bg-gray-700"
                      title="Reset Zoom"
                    >
                      <Crosshair className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-white">
                  T-Shirt Stamps:
                </label>
                <div className="flex flex-wrap gap-2">
                  {SHAPE_LIBRARY.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleAddPreset(preset.id)}
                      className="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-600/70"
                    >
                      {preset.icon}
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

interface ToolButtonProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  className?: string;
}

const ToolButton = ({
  icon,
  label,
  active,
  onClick,
  className = '',
}: ToolButtonProps) => {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`
        group relative rounded-lg p-3 transition-all
        ${
          active
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
        }
        ${className}
      `}
    >
      <div className="h-6 w-6">{icon}</div>
      <span className="absolute left-full ml-2 hidden whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
        {label}
      </span>
    </button>
  );
};

export default EnhancedCanvasDesigner;

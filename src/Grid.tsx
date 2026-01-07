"use client";

import { useEffect, useRef, useCallback } from "react";

export interface GridProps {
  /** Grid shape: 4 for squares, 6 for hexagons */
  shape?: 4 | 6;
  /** Size of each cell in pixels */
  cellSize?: number;
  /** Color of the grid lines (use "transparent" to hide) */
  lineColor?: string;
  /** Width of the grid lines */
  lineWidth?: number;
  /** Additional CSS classes */
  className?: string;
  /** Enable animated light particles */
  animated?: boolean;
  /** Color of the light particles and trails */
  lightColor?: string;
  /** Speed of the light particles (1-5 recommended) */
  lightSpeed?: number;
  /** Minimum travel distance before particle dies */
  minTravel?: number;
  /** Maximum travel distance before particle dies */
  maxTravel?: number;
  /** Milliseconds between particle spawns */
  spawnRate?: number;
  /** Probability of particle splitting (0-1) */
  splitChance?: number;
  /** Speed at which trails fade (lower = slower fade) */
  trailFadeSpeed?: number;
}

interface Node {
  x: number;
  y: number;
  key: string;
}

interface Edge {
  from: Node;
  to: Node;
  key: string;
}

interface Particle {
  id: number;
  currentNode: Node;
  targetNode: Node;
  progress: number;
  traveled: number;
  maxTravel: number;
  canSplit: boolean;
  dead: boolean;
}

interface Trail {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  opacity: number;
  edgeKey: string;
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

export function Grid({
  shape = 4,
  cellSize = 40,
  lineColor = "#e5e7eb",
  lineWidth = 1,
  className = "",
  animated = false,
  lightColor = "#3b82f6",
  lightSpeed = 2,
  minTravel = 2,
  maxTravel = 6,
  spawnRate = 1000,
  splitChance = 0.3,
  trailFadeSpeed = 0.01,
}: GridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Map<string, Node>>(new Map());
  const edgesRef = useRef<Edge[]>([]);
  const adjacencyRef = useRef<Map<string, Edge[]>>(new Map());
  const topNodesRef = useRef<Node[]>([]);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const trailsRef = useRef<Trail[]>([]);
  const lastSpawnRef = useRef<number>(0);
  const particleIdRef = useRef<number>(0);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const activeEdgesRef = useRef<Set<string>>(new Set());
  const explosionsRef = useRef<Explosion[]>([]);

  const nodeKey = (x: number, y: number) => `${Math.round(x * 100)},${Math.round(y * 100)}`;
  const edgeKey = (n1: Node, n2: Node) => {
    const keys = [n1.key, n2.key].sort();
    return `${keys[0]}-${keys[1]}`;
  };

  const getOrCreateNode = useCallback((x: number, y: number): Node => {
    const key = nodeKey(x, y);
    if (!nodesRef.current.has(key)) {
      nodesRef.current.set(key, { x, y, key });
    }
    return nodesRef.current.get(key)!;
  }, []);

  const addEdge = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const from = getOrCreateNode(x1, y1);
    const to = getOrCreateNode(x2, y2);
    const key = edgeKey(from, to);

    const existingEdge = edgesRef.current.find(e => e.key === key);
    if (existingEdge) return;

    const edge: Edge = { from, to, key };
    edgesRef.current.push(edge);

    if (!adjacencyRef.current.has(from.key)) {
      adjacencyRef.current.set(from.key, []);
    }
    if (!adjacencyRef.current.has(to.key)) {
      adjacencyRef.current.set(to.key, []);
    }
    adjacencyRef.current.get(from.key)!.push(edge);
    adjacencyRef.current.get(to.key)!.push(edge);
  }, [getOrCreateNode]);

  const buildSquareGraph = useCallback((width: number, height: number) => {
    nodesRef.current.clear();
    edgesRef.current = [];
    adjacencyRef.current.clear();
    topNodesRef.current = [];

    const cols = Math.ceil(width / cellSize) + 1;
    const rows = Math.ceil(height / cellSize) + 1;

    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        const x = i * cellSize;
        const y = j * cellSize;
        if (i < cols) addEdge(x, y, x + cellSize, y);
        if (j < rows) addEdge(x, y, x, y + cellSize);
      }
    }

    for (let i = 0; i <= cols; i++) {
      const node = nodesRef.current.get(nodeKey(i * cellSize, 0));
      if (node) topNodesRef.current.push(node);
    }
  }, [cellSize, addEdge]);

  const buildHexGraph = useCallback((width: number, height: number) => {
    nodesRef.current.clear();
    edgesRef.current = [];
    adjacencyRef.current.clear();
    topNodesRef.current = [];

    const size = cellSize / 2;
    const hexWidth = Math.sqrt(3) * size;
    const vertSpacing = size * 1.5;

    const cols = Math.ceil(width / hexWidth) + 2;
    const rows = Math.ceil(height / vertSpacing) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const cx = col * hexWidth + (row % 2 === 0 ? 0 : hexWidth / 2);
        const cy = row * vertSpacing;

        const vertices: { x: number; y: number }[] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          vertices.push({
            x: cx + size * Math.cos(angle),
            y: cy + size * Math.sin(angle),
          });
        }

        for (let i = 0; i < 6; i++) {
          const v1 = vertices[i];
          const v2 = vertices[(i + 1) % 6];
          addEdge(v1.x, v1.y, v2.x, v2.y);
        }
      }
    }

    const sortedNodes = Array.from(nodesRef.current.values())
      .filter(n => n.y >= 0 && n.y <= size)
      .sort((a, b) => a.x - b.x);
    topNodesRef.current = sortedNodes;
  }, [cellSize, addEdge]);

  const getConnectedNodes = useCallback((node: Node, excludeNode?: Node): Node[] => {
    const edges = adjacencyRef.current.get(node.key) || [];
    return edges
      .map(e => (e.from.key === node.key ? e.to : e.from))
      .filter(n => !excludeNode || n.key !== excludeNode.key);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let dpr = 1;

    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      for (const edge of edgesRef.current) {
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
      }

      ctx.stroke();
    };

    const drawTrails = (ctx: CanvasRenderingContext2D) => {
      for (const trail of trailsRef.current) {
        if (trail.opacity <= 0) continue;

        const alpha = Math.floor(trail.opacity * 0.15 * 255).toString(16).padStart(2, '0');

        ctx.strokeStyle = lightColor + alpha;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(trail.fromX, trail.fromY);

        if (trail.progress < 1) {
          const endX = trail.fromX + (trail.toX - trail.fromX) * trail.progress;
          const endY = trail.fromY + (trail.toY - trail.fromY) * trail.progress;
          ctx.lineTo(endX, endY);
        } else {
          ctx.lineTo(trail.toX, trail.toY);
        }
        ctx.stroke();

        ctx.shadowColor = lightColor;
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    const drawParticles = (ctx: CanvasRenderingContext2D) => {
      for (const particle of particlesRef.current) {
        if (particle.dead) continue;

        const x = particle.currentNode.x + (particle.targetNode.x - particle.currentNode.x) * particle.progress;
        const y = particle.currentNode.y + (particle.targetNode.y - particle.currentNode.y) * particle.progress;

        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawExplosions = (ctx: CanvasRenderingContext2D) => {
      for (const explosion of explosionsRef.current) {
        if (explosion.opacity <= 0) continue;

        const alpha = Math.floor(explosion.opacity * 255).toString(16).padStart(2, '0');
        ctx.strokeStyle = lightColor + alpha;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const updateExplosions = () => {
      for (const explosion of explosionsRef.current) {
        explosion.radius += 0.5;
        explosion.opacity -= 0.08;
      }
      explosionsRef.current = explosionsRef.current.filter(e => e.opacity > 0);
    };

    const createExplosion = (x: number, y: number) => {
      explosionsRef.current.push({
        x,
        y,
        radius: 2,
        maxRadius: 8,
        opacity: 1,
      });
    };

    const getRandomTravel = () => {
      return Math.floor(Math.random() * (maxTravel - minTravel + 1)) + minTravel;
    };

    const makeEdgeKey = (n1: Node, n2: Node) => {
      const keys = [n1.key, n2.key].sort();
      return `${keys[0]}-${keys[1]}`;
    };

    const spawnParticle = () => {
      if (topNodesRef.current.length === 0) return;

      const startNode = topNodesRef.current[Math.floor(Math.random() * topNodesRef.current.length)];
      const connectedNodes = getConnectedNodes(startNode);

      const downwardNodes = connectedNodes.filter(n => n.y > startNode.y);
      const targetNodes = downwardNodes.length > 0 ? downwardNodes : connectedNodes;

      const availableNodes = targetNodes.filter(n => {
        const key = makeEdgeKey(startNode, n);
        return !activeEdgesRef.current.has(key);
      });

      if (availableNodes.length === 0) return;

      const targetNode = availableNodes[Math.floor(Math.random() * availableNodes.length)];
      const edgeKeyStr = makeEdgeKey(startNode, targetNode);
      activeEdgesRef.current.add(edgeKeyStr);

      particlesRef.current.push({
        id: particleIdRef.current++,
        currentNode: startNode,
        targetNode,
        progress: 0,
        traveled: 0,
        maxTravel: getRandomTravel(),
        canSplit: true,
        dead: false,
      });

      trailsRef.current.push({
        fromX: startNode.x,
        fromY: startNode.y,
        toX: targetNode.x,
        toY: targetNode.y,
        progress: 0,
        opacity: 1,
        edgeKey: edgeKeyStr,
      });
    };

    const updateParticles = () => {
      const newParticles: Particle[] = [];

      for (const particle of particlesRef.current) {
        if (particle.dead) continue;

        particle.progress += lightSpeed * 0.02;

        const trailIndex = trailsRef.current.findIndex(
          t => t.fromX === particle.currentNode.x &&
               t.fromY === particle.currentNode.y &&
               t.toX === particle.targetNode.x &&
               t.toY === particle.targetNode.y &&
               t.progress < 1
        );
        if (trailIndex !== -1) {
          trailsRef.current[trailIndex].progress = Math.min(particle.progress, 1);
        }

        if (particle.progress >= 1) {
          particle.traveled++;

          if (particle.traveled >= particle.maxTravel) {
            const x = particle.targetNode.x;
            const y = particle.targetNode.y;
            createExplosion(x, y);
            particle.dead = true;
            continue;
          }

          const currentNode = particle.targetNode;
          const connectedNodes = getConnectedNodes(currentNode, particle.currentNode);

          const availableNodes = connectedNodes.filter(n => {
            const key = makeEdgeKey(currentNode, n);
            return !activeEdgesRef.current.has(key);
          });

          if (availableNodes.length === 0) {
            createExplosion(currentNode.x, currentNode.y);
            particle.dead = true;
            continue;
          }

          const shouldSplit = particle.canSplit && Math.random() < splitChance && availableNodes.length >= 2;

          if (shouldSplit) {
            const shuffled = [...availableNodes].sort(() => Math.random() - 0.5);
            const target1 = shuffled[0];
            const target2 = shuffled[1];

            const edgeKey1 = makeEdgeKey(currentNode, target1);
            const edgeKey2 = makeEdgeKey(currentNode, target2);
            activeEdgesRef.current.add(edgeKey1);
            activeEdgesRef.current.add(edgeKey2);

            particle.currentNode = currentNode;
            particle.targetNode = target1;
            particle.progress = 0;
            particle.canSplit = false;

            trailsRef.current.push({
              fromX: currentNode.x,
              fromY: currentNode.y,
              toX: target1.x,
              toY: target1.y,
              progress: 0,
              opacity: 1,
              edgeKey: edgeKey1,
            });

            newParticles.push({
              id: particleIdRef.current++,
              currentNode: currentNode,
              targetNode: target2,
              progress: 0,
              traveled: particle.traveled,
              maxTravel: particle.maxTravel,
              canSplit: false,
              dead: false,
            });

            trailsRef.current.push({
              fromX: currentNode.x,
              fromY: currentNode.y,
              toX: target2.x,
              toY: target2.y,
              progress: 0,
              opacity: 1,
              edgeKey: edgeKey2,
            });
          } else {
            const targetNode = availableNodes[Math.floor(Math.random() * availableNodes.length)];
            const newEdgeKey = makeEdgeKey(currentNode, targetNode);
            activeEdgesRef.current.add(newEdgeKey);

            particle.currentNode = currentNode;
            particle.targetNode = targetNode;
            particle.progress = 0;

            trailsRef.current.push({
              fromX: currentNode.x,
              fromY: currentNode.y,
              toX: targetNode.x,
              toY: targetNode.y,
              progress: 0,
              opacity: 1,
              edgeKey: newEdgeKey,
            });
          }
        }
      }

      particlesRef.current.push(...newParticles);
      particlesRef.current = particlesRef.current.filter(p => !p.dead);
    };

    const updateTrails = () => {
      for (const trail of trailsRef.current) {
        if (trail.progress >= 1) {
          trail.opacity -= trailFadeSpeed;
        }
      }
      const fadedTrails = trailsRef.current.filter(t => t.opacity <= 0);
      for (const trail of fadedTrails) {
        activeEdgesRef.current.delete(trail.edgeKey);
      }
      trailsRef.current = trailsRef.current.filter(t => t.opacity > 0);
    };

    const animate = (timestamp: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = dimensionsRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);
      drawGrid(ctx, width, height);

      if (animated) {
        if (timestamp - lastSpawnRef.current > spawnRate) {
          spawnParticle();
          lastSpawnRef.current = timestamp;
        }

        updateParticles();
        updateTrails();
        updateExplosions();
        drawTrails(ctx);
        drawParticles(ctx);
        drawExplosions(ctx);
      }

      ctx.restore();
      animationRef.current = requestAnimationFrame(animate);
    };

    const setup = () => {
      const { width, height } = container.getBoundingClientRect();
      dimensionsRef.current = { width, height };
      dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      if (shape === 4) {
        buildSquareGraph(width, height);
      } else {
        buildHexGraph(width, height);
      }

      particlesRef.current = [];
      trailsRef.current = [];
      activeEdgesRef.current.clear();
      explosionsRef.current = [];
    };

    const resizeObserver = new ResizeObserver(() => {
      setup();
    });

    resizeObserver.observe(container);
    setup();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationRef.current);
    };
  }, [shape, cellSize, lineColor, lineWidth, animated, lightColor, lightSpeed, minTravel, maxTravel, spawnRate, splitChance, trailFadeSpeed, buildSquareGraph, buildHexGraph, getConnectedNodes]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}

export default Grid;

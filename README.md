# react-grid-lights

A React component for animated grid backgrounds with traveling light particles. Create stunning visual effects with square or hexagonal grids and customizable light animations.

![npm version](https://img.shields.io/npm/v/react-grid-lights)
![license](https://img.shields.io/npm/l/react-grid-lights)

## Features

- **Two Grid Types**: Square (4-sided) and Hexagonal (6-sided) tessellations
- **Animated Light Particles**: Particles travel along grid edges with smooth animations
- **Particle Splitting**: Lights can split into multiple paths at intersections
- **Fading Trails**: Particles leave behind glowing trails that slowly fade
- **Explosion Effects**: Small burst animation when particles reach their end
- **Collision Avoidance**: Particles automatically avoid crossing paths
- **Fully Customizable**: Control colors, speeds, sizes, and behaviors
- **Responsive**: Automatically adapts to container size changes
- **HiDPI Support**: Crisp rendering on retina displays

## Installation

```bash
npm install react-grid-lights
```

```bash
yarn add react-grid-lights
```

```bash
pnpm add react-grid-lights
```

## Quick Start

```tsx
import { Grid } from "react-grid-lights";

function App() {
  return (
    <div style={{ width: "100%", height: "400px" }}>
      <Grid
        shape={6}
        animated
        lightColor="#3b82f6"
      />
    </div>
  );
}
```

## Examples

### Basic Hexagon Grid (Static)

```tsx
<Grid shape={6} cellSize={60} lineColor="#e5e7eb" />
```

### Animated Square Grid

```tsx
<Grid
  shape={4}
  cellSize={40}
  animated
  lightColor="#10b981"
  lightSpeed={2}
/>
```

### Invisible Grid with Light Trails Only

```tsx
<Grid
  shape={6}
  cellSize={80}
  lineColor="transparent"
  animated
  lightColor="#8b5cf6"
  lightSpeed={2}
  minTravel={3}
  maxTravel={10}
  spawnRate={500}
  splitChance={0.4}
  trailFadeSpeed={0.005}
/>
```

### Full Configuration Example

```tsx
<Grid
  shape={6}                    // Hexagonal grid
  cellSize={100}               // 100px cell size
  lineColor="transparent"      // Hide grid lines
  lineWidth={1}                // Grid line width
  animated                     // Enable animations
  lightColor="#3b82f6"         // Blue lights
  lightSpeed={2}               // Medium speed
  minTravel={3}                // Min 3 edges traveled
  maxTravel={12}               // Max 12 edges traveled
  spawnRate={600}              // New particle every 600ms
  splitChance={0.4}            // 40% chance to split
  trailFadeSpeed={0.005}       // Slow trail fade
  className="my-custom-class"  // Additional CSS classes
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `shape` | `4 \| 6` | `4` | Grid shape: `4` for squares, `6` for hexagons |
| `cellSize` | `number` | `40` | Size of each cell in pixels |
| `lineColor` | `string` | `"#e5e7eb"` | Color of grid lines (use `"transparent"` to hide) |
| `lineWidth` | `number` | `1` | Width of grid lines in pixels |
| `className` | `string` | `""` | Additional CSS classes for the container |
| `animated` | `boolean` | `false` | Enable animated light particles |
| `lightColor` | `string` | `"#3b82f6"` | Color of light particles and trails |
| `lightSpeed` | `number` | `2` | Speed of particles (1-5 recommended) |
| `minTravel` | `number` | `2` | Minimum edges a particle travels before dying |
| `maxTravel` | `number` | `6` | Maximum edges a particle travels before dying |
| `spawnRate` | `number` | `1000` | Milliseconds between new particle spawns |
| `splitChance` | `number` | `0.3` | Probability (0-1) of particle splitting at nodes |
| `trailFadeSpeed` | `number` | `0.01` | How fast trails fade (lower = slower) |

## Styling

The component renders a container `div` with a `canvas` element inside. The container has `position: relative` and uses `width: 100%` and `height: 100%` by default.

**Important**: The component will fill its parent container. Make sure the parent has a defined height.

```tsx
// Good - parent has explicit height
<div style={{ height: "400px" }}>
  <Grid animated />
</div>

// Good - parent uses flex/grid with defined dimensions
<div className="h-screen flex items-center">
  <div className="w-full h-96">
    <Grid animated />
  </div>
</div>
```

## How It Works

1. **Grid Generation**: On mount, the component builds a graph of nodes and edges based on the selected shape (square or hexagonal tessellation).

2. **Particle System**: When `animated` is true, particles spawn from the top edge of the grid and travel downward along connected edges.

3. **Path Finding**: Each particle randomly selects available edges at each node, avoiding edges currently occupied by other particles.

4. **Splitting**: Particles can split into two at intersections based on `splitChance`. Each particle can only split once.

5. **Trail Rendering**: As particles move, they leave behind glowing trails that persist and slowly fade based on `trailFadeSpeed`.

6. **Lifecycle**: Particles die after traveling `minTravel` to `maxTravel` edges (randomly determined), triggering a small explosion effect.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires browsers with support for:
- Canvas 2D API
- ResizeObserver
- requestAnimationFrame

## TypeScript

Full TypeScript support with exported types:

```tsx
import { Grid, type GridProps } from "react-grid-lights";

const props: GridProps = {
  shape: 6,
  animated: true,
  lightColor: "#3b82f6",
};

<Grid {...props} />
```

## Performance Tips

- Use larger `cellSize` values for better performance on large containers
- Increase `spawnRate` to reduce the number of active particles
- Reduce `maxTravel` to limit particle lifetime
- Lower `splitChance` to reduce particle count
- Use `lineColor="transparent"` if you only want to show the animated lights

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

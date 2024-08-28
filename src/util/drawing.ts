import type { Point } from "ixfx/geometry.js";

const PiPi = Math.PI * 2;

export const traceLine = (ctx: CanvasRenderingContext2D, ...points: Array<Point | undefined>) => {
  if (points.length < 2) return;
  ctx.moveTo(points[ 0 ]!.x, points[ 0 ]!.y);
  for (let i = 1; i < points.length; i++) {
    if (points[ i ] === undefined) continue;
    ctx.lineTo(points[ i ]!.x, points[ i ]!.y);
  }
}

export const drawDot = (ctx: CanvasRenderingContext2D, point: Point, radius: number, fillStyle?: string, label?: string, labelFillStyle?: string) => {
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, PiPi, false);
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
  }
  ctx.fill();

  if (label) {
    if (labelFillStyle) ctx.fillStyle = labelFillStyle;
    ctx.fillText(label, point.x + radius, point.y - radius);
  }
}

const toAbsolute = (el: HTMLCanvasElement) => (pt: Point) => {
  return { x: pt.x * el.width, y: pt.y * el.height }
}

const vpScale = (el: HTMLCanvasElement) => {
  const s = Math.min(el.width, el.height);
  return (v: number) => {
    return v * s;
  }
}

export const wrap = (el: HTMLCanvasElement) => {
  const ctx = el.getContext(`2d`);
  if (!ctx) throw new Error(`Context unavailable`);

  const abs = toAbsolute(el);

  const dot = (point: Point, radius: number, fillStyle?: string, label?: string, labelFillStyle?: string) => {
    drawDot(ctx, abs(point), scale(radius), fillStyle, label, labelFillStyle);
  }

  const clear = () => {
    ctx.clearRect(0, 0, el.width, el.height);
  }

  const fill = (style?: string) => {
    if (style) ctx.fillStyle = style;
    ctx.fillRect(0, 0, el.width, el.height);
  }

  const line = (a: Point, b: Point, width: number) => {
    a = abs(a);
    b = abs(b);
    width = scale(width);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
  }

  const joinPoints = (width: number, ...points: Array<Point>) => {
    width = scale(width);
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const pt = abs(points[ i ]!);
      if (i === 0) {
        ctx.moveTo(pt.x, pt.y);
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
    }
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
  }

  const scale = vpScale(el);

  const testPattern = () => {
    ctx.beginPath();
    ctx.strokeStyle = `red`;
    ctx.lineWidth = 2;
    traceLine(ctx, { x: 0, y: 0 }, { x: el.width, y: el.height });
    traceLine(ctx, { x: 0, y: el.height }, { x: el.width, y: 0 });
    ctx.stroke();
  }

  const text = (text: string, point: Point, style?: string) => {
    point = abs(point);
    if (style) ctx.fillStyle = style;
    ctx.fillText(text, point.x, point.y);
  }
  return { dot, abs, clear, testPattern, scale, line, joinPoints, fill, text, ctx }

}

export type Typewriter = ReturnType<typeof typewriter>;

export const typewriter = (ctx: CanvasRenderingContext2D, x = 0, y = 0) => {
  const measure = (msg: string) => {
    const m = ctx.measureText(msg);
    return {
      width: m.width,
      height: m.fontBoundingBoxAscent + m.fontBoundingBoxDescent
    }
  }

  const move = (toX: number, toY: number) => {
    x = toX;
    y = toY;
  }

  const line = (msg: string, colour?: string) => {
    const r = measure(msg);
    if (colour) ctx.fillStyle = colour;
    ctx.fillText(msg, x, y);
    y += r.height;
  }

  const word = (msg: string, colour?: string) => {
    const r = measure(msg);
    if (colour) ctx.fillStyle = colour;
    ctx.fillText(msg, x, y);
    x += r.width;
  }

  return { line, word, move }
}

export type Wrapper = ReturnType<typeof wrap>;

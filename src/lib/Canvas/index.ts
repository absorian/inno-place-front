import Canvas from "./Canvas.svelte"
export { Canvas }

import type { Vec } from "ella-math"

export interface Pixel {
    color: string;

    author: string;
    timestamp: number
};

export interface CanvasClickEvent {
    position: Vec,
}

export type CanvasUpdateFunc = (x: number, y: number) => void;

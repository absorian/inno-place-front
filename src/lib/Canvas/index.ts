import Canvas from "./Canvas.svelte"
import type { Vec } from "ella-math"

export interface Pixel {
    color: string;

    author: string;
    timestamp: number
};

export interface PutColorEvent {
    position: Vec,
}

export { Canvas }
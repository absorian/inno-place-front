import Canvas from "./Canvas.svelte"
import type { Vec } from "ella-math"

export interface Pixel {
    color: string;

    // author, timestamp
};

export interface PutColorEvent {
    position: Vec,
    color: string
}

export { Canvas }
<script lang="ts">
	import { onMount } from 'svelte';
	// import { Vec } from 'Vec2d';
	import { Vec } from 'ella-math';
	// import uniqolor from 'uniqolor';

	function rand_int(max: number) {
		return Math.floor(Math.random() * max);
	}

	const zero_vec: Vec = new Vec(0, 0)
	// type Vec = {
	// 	x: number;
	// 	y: number;
	// };
	
	type Pixel = {
		color: string;

		// author, timestamp
	};

	class Chunk {
		coord: Vec;
		pixels: Pixel[][] = [];
		canv_buff: HTMLCanvasElement;
		context: CanvasRenderingContext2D;
		size: Vec;
		constructor(coord: Vec, size: Vec) {
			this.coord = coord;
			this.size = size;
			this.pixels.length = size.x;
			for (let i = 0; i < size.x; i++) {
				this.pixels[i] = [];
				this.pixels[i].length = size.y;
				for (let j = 0; j < size.y; j++) {
					this.pixels[i][j] = {
						color: ''
					};
				}
			}
			this.canv_buff = document.createElement('canvas');
			this.canv_buff.width = pixel_size * size.x;
			this.canv_buff.height = pixel_size * size.y;

			this.context = this.canv_buff.getContext('2d') as CanvasRenderingContext2D;
		}
	}

	type Area = {
		begin: Vec;
		end: Vec;
	};

	const pixel_size: number = 25;
	let chunk1: Chunk;
	function pixel_coord(chunk: Chunk, idx: Vec): Vec {
		return idx.mul(pixel_size);
	}

	function screen_to_world(at: Vec): Vec {
		return at.div(zoom).sub(pan_offset);
	}

	function pixel_pos(chunk: Chunk, at: Vec): Vec {
		const pos: Vec = screen_to_world(at).sub(chunk.coord).div(pixel_size);
		return new Vec(Math.floor(pos.x), Math.floor(pos.y));
	}

	let canv: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let is_dragging: boolean = false;
	let was_dragging: boolean = false;

	let pan_offset: Vec = zero_vec;
	let screen_size: Vec = zero_vec;
	let screen_center: Vec = zero_vec;

	let zoom: number = 1;
	let old_zoom: number = 1;
	let mousepos: Vec = zero_vec;

	onMount(() => {
		ctx = canv.getContext('2d') as CanvasRenderingContext2D;
		let px_count = 655;
		chunk1 = new Chunk(zero_vec, new Vec(px_count, px_count));
		for (let i = 0; i < chunk1.pixels.length; i++) {
			for (let j = 0; j < chunk1.pixels.length; j++) {
				chunk1.pixels[i][j] = {
					color: "black"
					// color: `#${rand_int(256 * 256 * 255).toString(16)}`
					// color: `#${(i + j) % 100}${j % 100}${(i + j) % 100}`
					// color: uniqolor.random({
					// 	saturation: 50,
					// 	lightness: [40, 60]
					// }).color
				};
			}
		}
		console.log('Beginning to render canvas');
		draw();
	});

	let drawing: boolean = true;

	function draw() {
		screen_size = new Vec(canv.width = window.innerWidth, canv.height = window.innerHeight);
		screen_center = screen_size.div(2);

		ctx.scale(zoom, zoom);

		pan_offset = pan_offset.sub(mousepos.div(old_zoom).sub(mousepos.div(zoom)));
		// pan_offset = pan_offset.sub(mousepos.mul((zoom - old_zoom) / zoom * old_zoom));
		ctx.translate(pan_offset.x, pan_offset.y);
		old_zoom = zoom;
		// ctx.clearRect(0, 0, screen_size.x, screen_size.y);

		// let render_pixels: Area = {
		// 	begin: pixel_pos(chunk1, zero_vec),
		// 	end: pixel_pos(chunk1, screen_size)
		// };

		if (drawing) {
			drawing = false;
			
			for (let i = 0; i < chunk1.pixels.length; i++) {
				for (let j = 0; j < chunk1.pixels.length; j++) {
					chunk1.context.fillStyle = chunk1.pixels[i][j].color;
					let pos = pixel_coord(chunk1, new Vec(i, j));
					chunk1.context.fillRect(pos.x, pos.y, pixel_size, pixel_size);
				}
			}
		}

		ctx.drawImage(chunk1.canv_buff, chunk1.coord.x, chunk1.coord.y);
		requestAnimationFrame(draw);
	}

	function m_move(e: MouseEvent) {
		mousepos = new Vec(e.clientX, e.clientY);

		if (is_dragging) {
			pan_offset = pan_offset.add(new Vec(e.movementX, e.movementY).div(zoom))
			
			was_dragging = true;
		}
	}

	function m_click(e: MouseEvent) {
		if (was_dragging) {
			was_dragging = false;
			return;
		}
		let pos: Vec = pixel_pos(chunk1, new Vec(e.clientX, e.clientY));

		console.log(pos);
		console.log(chunk1.pixels[pos.x][pos.y].color);
	}

	function m_down(e: MouseEvent) {
		// if (e.button != 0) return; //
		is_dragging = true;
	}

	function m_up(e: MouseEvent) {
		is_dragging = false;
	}

	function m_wheel(e: WheelEvent) {
		let inc: number = -e.deltaY * 0.0003 * (zoom + 0.5);

		const lower_lim =
			Math.min(screen_size.x, screen_size.y) / (pixel_size * (chunk1.pixels.length + 10));
		const upper_lim = 3;

		if (zoom + inc <= lower_lim) {
			zoom = lower_lim;
			pan_offset = screen_to_world(screen_size).sub(screen_to_world(zero_vec)).div(2).sub(chunk1.size.mul(pixel_size / 2));
		} else if (zoom + inc >= upper_lim) zoom = upper_lim;
		else zoom += inc;
	}

	function put_color(e: MouseEvent) {
		if (was_dragging) {
			//
			was_dragging = false;
			return;
		}
		let pixel: Vec = pixel_pos(chunk1, new Vec(e.clientX, e.clientY));
		chunk1.pixels[pixel.x][pixel.y].color = 'red';
		chunk1.context.fillStyle = chunk1.pixels[pixel.x][pixel.y].color;
		let pos = pixel_coord(chunk1, pixel);
		chunk1.context.fillRect(pos.x, pos.y, pixel_size, pixel_size);
	}
</script>

<svelte:window />

<canvas
	bind:this={canv}
	on:contextmenu|preventDefault={put_color}
	on:click={m_click}
	on:mousemove={m_move}
	on:mousedown={m_down}
	on:mouseup={m_up}
	on:wheel={m_wheel}
/>

<style>
	canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;

		background-color: rgb(228, 228, 228);
	}
</style>

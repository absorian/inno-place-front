<script lang="ts">
	import { onMount } from 'svelte';
	import { Vec } from 'ella-math';

	export let pixel_size: number = 10;
	export let pixels: Pixel[][] = [];
	export let selected_color: string = "red";

	const zero_vec: Vec = new Vec(0, 0);

	type Pixel = {
		color: string;

		// author, timestamp
	};
	type Area = {
		begin: Vec;
		end: Vec;
	};

	function idx_to_world(idx: Vec): Vec {
		return idx.mul(pixel_size);
	}

	function screen_to_world(at: Vec): Vec {
		return at.div(zoom).sub(pan_offset);
	}

	function screen_to_idx(at: Vec): Vec {
		const pos: Vec = screen_to_world(at).div(pixel_size);
		return new Vec(Math.floor(pos.x), Math.floor(pos.y));
	}

	let canv: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let canv_buf: HTMLCanvasElement;
	let ctx_buf: CanvasRenderingContext2D;
	let pixels_count: Vec;

	let is_dragging: boolean = false;
	let was_dragging: boolean = false;

	let pan_offset: Vec = zero_vec;
	let screen_size: Vec = zero_vec;

	let zoom: number = 1;
	let old_zoom: number = 1;
	let mousepos: Vec = zero_vec;

	onMount(() => {
		ctx = canv.getContext('2d') as CanvasRenderingContext2D;

		pixels_count = new Vec(pixels.length)
		canv_buf = document.createElement('canvas'); // uses document
		canv_buf.width = pixel_size * pixels_count.x;
		canv_buf.height = pixel_size * pixels_count.y;

		ctx_buf = canv_buf.getContext('2d') as CanvasRenderingContext2D;

		draw();
	});

	let drawing: boolean = true;

	function draw() {
		screen_size = new Vec((canv.width = window.innerWidth), (canv.height = window.innerHeight));

		ctx.scale(zoom, zoom);

		pan_offset = pan_offset.sub(mousepos.div(old_zoom).sub(mousepos.div(zoom)));
		ctx.translate(pan_offset.x, pan_offset.y);
		old_zoom = zoom;
		// ctx.clearRect(0, 0, screen_size.x, screen_size.y);

		// let render_pixels: Area = {
		// 	begin: pixel_pos(chunk1, zero_vec),
		// 	end: pixel_pos(chunk1, screen_size)
		// };

		if (drawing) {
			drawing = false;

			for (let i = 0; i < pixels.length; i++) {
				for (let j = 0; j < pixels.length; j++) {
					ctx_buf.fillStyle = pixels[i][j].color;
					let pos = idx_to_world(new Vec(i, j));
					ctx_buf.fillRect(pos.x, pos.y, pixel_size, pixel_size);
				}
			}
		}

		ctx.drawImage(canv_buf, 0, 0);
		requestAnimationFrame(draw);
	}

	function m_move(e: MouseEvent) {
		mousepos = new Vec(e.clientX, e.clientY);

		if (is_dragging) {
			pan_offset = pan_offset.add(new Vec(e.movementX, e.movementY).div(zoom));

			was_dragging = true;
		}
	}

	function m_click(e: MouseEvent) {
		if (was_dragging) {
			was_dragging = false;
			return;
		}
		let pos: Vec = screen_to_idx(new Vec(e.clientX, e.clientY));

		console.log(pos);
		console.log(pixels[pos.x][pos.y].color);
	}

	function m_down(e: MouseEvent) {
		is_dragging = true;
	}

	function m_up(e: MouseEvent) {
		is_dragging = false;
	}

	function m_wheel(e: WheelEvent) {
		let inc: number = -e.deltaY * 0.0003 * (zoom + 0.5);

		const lower_lim =
			Math.min(screen_size.x, screen_size.y) / (pixel_size * (pixels_count.x + 10));
		const upper_lim = 3;

		if (zoom + inc <= lower_lim) {
			zoom = lower_lim;
			pan_offset = screen_to_world(screen_size)
				.sub(screen_to_world(zero_vec))
				.div(2)
				.sub(pixels_count.mul(pixel_size / 2));
		} else if (zoom + inc >= upper_lim) zoom = upper_lim;
		else zoom += inc;
	}

	function put_color(e: MouseEvent) {
		if (was_dragging) {
			was_dragging = false;
			return;
		}
		let pixel: Vec = screen_to_idx(new Vec(e.clientX, e.clientY));
		
		ctx_buf.fillStyle = pixels[pixel.x][pixel.y].color = selected_color;

		let pos = idx_to_world(pixel);
		ctx_buf.fillRect(pos.x, pos.y, pixel_size, pixel_size);
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

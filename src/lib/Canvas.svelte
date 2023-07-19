<script lang="ts">
	import { onMount } from 'svelte';
	// import uniqolor from 'uniqolor';

	function rand_int(max: number) {
		return Math.floor(Math.random() * max);
	}

	type Vec2 = {
		x: number;
		y: number;
	};

	function add_vec(a: Vec2, b: Vec2) {
		return {
			x: a.x + b.x,
			y: a.y + b.y
		};
	}
	function sub_vec(a: Vec2, b: Vec2) {
		return {
			x: a.x - b.x,
			y: a.y - b.y
		};
	}
	function scale_vec(a: Vec2, mul: number) {
		return {
			x: a.x * mul,
			y: a.y * mul
		};
	}

	const zero_vec: Vec2 = {
		x: 0,
		y: 0
	};

	type Pixel = {
		color: string;

		// author, timestamp
	};

	class Chunk {
		coord: Vec2;
		pixels: Pixel[][] = [];
		canv_buff: HTMLCanvasElement;
		context: CanvasRenderingContext2D;

		constructor(coord: Vec2, size: Vec2) {
			this.coord = coord;
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
		begin: Vec2;
		end: Vec2;
	};

	const pixel_size: number = 25;
	let chunk1: Chunk;
	function pixel_coord(chunk: Chunk, i: number, j: number): Vec2 {
		return {
			x: pixel_size * i,
			y: pixel_size * j
		};
	}

	function screen_to_world(at: Vec2) {
		return {
			x: at.x / zoom - pan_offset.x,
			y: at.y / zoom - pan_offset.y
		};
	}

	function pixel_pos(chunk: Chunk, at: Vec2): Vec2 {
		let pos: Vec2 = screen_to_world(at);
		return {
			x: Math.floor((pos.x - chunk.coord.x) / pixel_size),
			y: Math.floor((pos.y - chunk.coord.y) / pixel_size)
		};
	}

	let canv: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let is_dragging: boolean = false;
	let was_dragging: boolean = false;

	let pan_offset: Vec2 = zero_vec;
	let screen_size: Vec2 = zero_vec;
	let screen_center: Vec2 = zero_vec;

	let zoom: number = 1;
	let old_zoom: number = 1;
	let mousepos: Vec2 = zero_vec;

	onMount(() => {
		ctx = canv.getContext('2d') as CanvasRenderingContext2D;
		let px_count = 655;
		chunk1 = new Chunk({ x: 0, y: 0 }, { x: px_count, y: px_count });
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
		screen_size = {
			x: (canv.width = window.innerWidth),
			y: (canv.height = window.innerHeight)
		};
		screen_center = {
			x: screen_size.x / 2,
			y: screen_size.y / 2
		};

		ctx.scale(zoom, zoom);

		pan_offset = {
			x: pan_offset.x - (mousepos.x / old_zoom - mousepos.x / zoom),
			y: pan_offset.y - (mousepos.y / old_zoom - mousepos.y / zoom)
		};
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
					let pos = pixel_coord(chunk1, i, j);
					chunk1.context.fillRect(pos.x, pos.y, pixel_size, pixel_size);
				}
			}
		}

		ctx.drawImage(chunk1.canv_buff, chunk1.coord.x, chunk1.coord.y);
		requestAnimationFrame(draw);
	}

	function m_move(e: MouseEvent) {
		mousepos = {
			x: e.clientX,
			y: e.clientY
		};

		if (is_dragging) {
			pan_offset.x += e.movementX / zoom;
			pan_offset.y += e.movementY / zoom;

			was_dragging = true;
		}
	}

	function m_click(e: MouseEvent) {
		if (was_dragging) {
			was_dragging = false;
			return;
		}
		let pos: Vec2 = pixel_pos(chunk1, {
			x: e.clientX,
			y: e.clientY
		});

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
		let inc: number = -e.deltaY * 0.0005 * zoom;

		const lower_lim =
			Math.min(screen_size.x, screen_size.y) / (pixel_size * (chunk1.pixels.length + 10));
		const upper_lim = 3;

		if (zoom + inc <= lower_lim) {
			zoom = lower_lim;
			pan_offset = sub_vec(
				scale_vec(sub_vec(screen_to_world(screen_size), screen_to_world(zero_vec)), 0.5),
				{ x: (pixel_size * chunk1.pixels.length) / 2, y: (pixel_size * chunk1.pixels.length) / 2 }
			);
		} else if (zoom + inc >= upper_lim) zoom = upper_lim;
		else zoom += inc;
		// console.log(zoom);
	}

	function put_color(e: MouseEvent) {
		if (was_dragging) {
			//
			was_dragging = false;
			return;
		}
		let pixel: Vec2 = pixel_pos(chunk1, {
			x: e.clientX,
			y: e.clientY
		});
		chunk1.pixels[pixel.x][pixel.y].color = 'red';
		chunk1.context.fillStyle = chunk1.pixels[pixel.x][pixel.y].color;
		let pos = pixel_coord(chunk1, pixel.x, pixel.y);
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

<script lang="ts">
	import { onMount } from 'svelte';

	type Vec2 = {
		x: number;
		y: number;
	};
	const zero_vec: Vec2 = {
		x: 0,
		y: 0
	};

	type Pixel = {
		color: string;

		// author, timestamp
	};

	type Chunk = {
		coord: Vec2;
		pixels: Pixel[][];
	};

	type Area = {
		begin: Vec2;
		end: Vec2;
	};

	function min(a: number, b: number) {
		return a < b ? a : b;
	}

	function constrain_val(val: Vec2, con: Vec2): Vec2 {
		if (val.x < 0) val.x = 0;
		if (val.y < 0) val.y = 0;

		if (val.x > con.x) val.x = con.x;
		if (val.y > con.y) val.y = con.y;
		return val;
	}

	let chunk1: Chunk = {
		coord: {
			x: 100,
			y: 100
		},
		pixels: []
	};
	const pixel_size: number = 25;
	function pixel_coord(chunk: Chunk, i: number, j: number): Vec2 {
		return {
			x: pixel_size * i + chunk.coord.x,
			y: pixel_size * j + chunk.coord.y
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
		chunk1.pixels.length = 1000;
		for (let i = 0; i < chunk1.pixels.length; i++) {
			chunk1.pixels[i] = [];
			chunk1.pixels[i].length = chunk1.pixels.length;
			for (let j = 0; j < chunk1.pixels.length; j++) {
				chunk1.pixels[i][j] = {
                    color: "black"
					// color: uniqolor.random({
					// 	saturation: 50,
					// 	lightness: [40, 60]
					// }).color
				};
			}
		}
		draw();
	});

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
		ctx.clearRect(0, 0, screen_size.x, screen_size.y);

		let render_pixels: Area = {
			begin: pixel_pos(chunk1, zero_vec),
			end: pixel_pos(chunk1, screen_size)
		};

		constrain_val(render_pixels.begin, {
			x: chunk1.pixels.length,
			y: chunk1.pixels.length
		});
		constrain_val(render_pixels.end, {
			x: chunk1.pixels.length,
			y: chunk1.pixels.length
		});

		// shit code
		// if (zoom < 0.2) {
		//     for (let i = render_pixels.begin.x % 3 == 0 ? render_pixels.begin.x : ((render_pixels.begin.x - 1) % 3 == 0 ? render_pixels.begin.x - 1 : render_pixels.begin.x - 2); i < min(chunk1.pixels.length, render_pixels.end.x + 1); i+=3) {
		//         for (let j = render_pixels.begin.y % 3 == 0 ? render_pixels.begin.y : ((render_pixels.begin.y - 1) % 3 == 0 ? render_pixels.begin.y - 1 : render_pixels.begin.y - 2); j < min(chunk1.pixels.length, render_pixels.end.y + 1); j+=3) {
		//             let cl = colord(chunk1.pixels[i][j].color)
		//             for(let k = 0; k < 3; k++) {
		//                 for(let l = 0; l < 3; l++) {
		//                     cl.mix(chunk1.pixels[i + k][j + l].color)
		//                 }
		//             }
		//             ctx.fillStyle = cl.toHex()
		//             let pos = pixel_coord(chunk1, i, j);
		//             ctx.fillRect(pos.x, pos.y, pixel_size * 3, pixel_size * 3);
		//         }
		//     }
		// } else if (zoom < 0.3) {
		//     for (let i = render_pixels.begin.x % 2 == 0 ? render_pixels.begin.x : render_pixels.begin.x - 1; i < min(chunk1.pixels.length, render_pixels.end.x + 1); i+=2) {
		//         for (let j = render_pixels.begin.y % 2 == 0 ? render_pixels.begin.y : render_pixels.begin.y - 1; j < min(chunk1.pixels.length, render_pixels.end.y + 1); j+=2) {
		//             let cl = colord(chunk1.pixels[i][j].color)
		//             for(let k = 0; k < 2; k++) {
		//                 for(let l = 0; l < 2; l++) {
		//                     cl.mix(chunk1.pixels[i + k][j + l].color)
		//                 }
		//             }
		//             ctx.fillStyle = cl.toHex()
		//             let pos = pixel_coord(chunk1, i, j);
		//             ctx.fillRect(pos.x, pos.y, pixel_size * 2, pixel_size * 2);
		//         }
		//     }
		// } else

		{
			for (
				let i = render_pixels.begin.x;
				i < min(chunk1.pixels.length, render_pixels.end.x + 1);
				i++
			) {
				for (
					let j = render_pixels.begin.y;
					j < min(chunk1.pixels.length, render_pixels.end.y + 1);
					j++
				) {
					ctx.fillStyle = chunk1.pixels[i][j].color;
					let pos = pixel_coord(chunk1, i, j);
					ctx.fillRect(pos.x, pos.y, pixel_size, pixel_size);
				}
			}
		}
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
		console.log(
			pixel_pos(chunk1, {
				x: e.clientX,
				y: e.clientY
			})
		);
	}

	function m_down(e: MouseEvent) {
		if (e.button != 0) return; //
		is_dragging = true;
	}

	function m_up(e: MouseEvent) {
		is_dragging = false;
	}

	function m_wheel(e: WheelEvent) {
		let inc: number = -e.deltaY * 0.0003;

		if (zoom + inc <= 0.1) zoom = 0.1;
		else if (zoom + inc >= 3) zoom = 3;
		else zoom += inc;
		// console.log(zoom);
	}

	function put_color(e: MouseEvent) {
        // if (was_dragging) {
        //     was_dragging = false;
        //     return;
        // }
		let pixel: Vec2 = pixel_pos(chunk1, {
			x: e.clientX,
			y: e.clientY
		});
		chunk1.pixels[pixel.x][pixel.y].color = 'red';
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

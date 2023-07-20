<script lang="ts">
	import { Canvas } from "$lib";
	import type { Pixel, PutColorEvent } from "$lib";

	// demo
	const arr_size: number = 1000;
	let selected_color: string = "#aa55f1";

	let canvas_update: (x: number, y: number) => void;
	
	let arr: Pixel[][] = []
	arr.length = arr_size;
	for(let i = 0; i < arr_size; i++) {
		arr[i] = []
		arr[i].length = arr_size;
		for(let j = 0; j < arr_size; j++) {
			arr[i][j] = {
				color: (i + j % 2) % 2 == 0 ? "gray" : "black",
				author: "",
				timestamp: Date.now()
			}
		}
	}

	function canvas_click_cb(e: CustomEvent<PutColorEvent>) {
		let pos = e.detail.position;
		console.log(`Pixel is changed at: ${pos.toString()}`);
		arr[pos.x][pos.y] = {
			color: selected_color,
			author: "me",
			timestamp: Date.now()
		}
		// socket emit
		canvas_update(pos.x, pos.y);
	}
</script>

<Canvas pixels={arr} on:click={canvas_click_cb} bind:update={canvas_update}/>


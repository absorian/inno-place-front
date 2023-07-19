<script lang="ts">
	import { Canvas } from "$lib";
	import type { Pixel } from "$lib";

	// demo
	const arr_size: number = 1000;
	let arr: Pixel[][] = []

	arr.length = arr_size;
	for(let i = 0; i < arr_size; i++) {
		arr[i] = []
		arr[i].length = arr_size;
		for(let j = 0; j < arr_size; j++) {
			arr[i][j] = {
				color: (i + j % 2) % 2 == 0 ? "gray" : "black"
			}
		}
	}
</script>

<Canvas pixels={arr} selected_color={"#aa55f1"}/>


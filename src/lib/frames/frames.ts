import frames from 'virtual:frames'
import type { Frame } from '$lib/session/session'

export const FRAMES: readonly Frame[] = frames

export type FrameId = Frame['id']

export const FRAME_ASSETS = FRAMES.filter((frame) => frame.size === '2x6').map((frame) => frame.src)

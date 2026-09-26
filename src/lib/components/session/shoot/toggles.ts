import RiFlashlightFill from 'remixicon-svelte/icons/flashlight-fill'
import RiFlashlightLine from 'remixicon-svelte/icons/flashlight-line'
import RiFlipHorizontalLine from 'remixicon-svelte/icons/flip-horizontal-line'
import RiVolumeMuteLine from 'remixicon-svelte/icons/volume-mute-line'
import RiVolumeUpLine from 'remixicon-svelte/icons/volume-up-line'
import RiCameraLine from 'remixicon-svelte/icons/camera-line'
import RiUploadLine from 'remixicon-svelte/icons/upload-2-line'
import type { ShootState } from '$lib/capture/shoot-state.svelte'
import { m } from '$lib/paraglide/messages'

export const SOURCES = [
	{ value: 'camera', icon: RiCameraLine, label: m['session.source.camera'], short: m['session.source.camera'] },
	{ value: 'upload', icon: RiUploadLine, label: m['session.source.upload'], short: m['session.source.gallery'] }
] as const

export function cameraToggles(shooter: ShootState) {
	return [
		{
			label: m['session.shoot.mirror_toggle'](),
			isOn: shooter.camera.isMirrored,
			icon: RiFlipHorizontalLine,
			isLocked: true,
			flip: () => (shooter.camera.isMirrored = !shooter.camera.isMirrored)
		},
		{
			label: m['session.shoot.sound'](),
			isOn: !shooter.isMuted,
			icon: shooter.isMuted ? RiVolumeMuteLine : RiVolumeUpLine,
			isLocked: false,
			flip: () => (shooter.isMuted = !shooter.isMuted)
		},
		{
			label: m['session.shoot.flash'](),
			isOn: shooter.isFlashOn,
			icon: shooter.isFlashOn ? RiFlashlightFill : RiFlashlightLine,
			isLocked: true,
			flip: () => (shooter.isFlashOn = !shooter.isFlashOn)
		}
	]
}

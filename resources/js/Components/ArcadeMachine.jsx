import '@google/model-viewer';

export default function ArcadeMachine() {
    return (
        <div className="w-[400px] h-[400px] md:w-[500px] md:h-[500px]">
            <model-viewer
                src="/models/archade_machine.glb"
                alt="Arcade Machine 3D Model"
                auto-rotate
                rotation-per-second="8deg"
                camera-controls
                disable-zoom
                environment-image="neutral"
                shadow-intensity="1"
                exposure="1.1"
                style={{
                    width: '100%',
                    height: '100%',
                }}
            />
        </div>
    );
}

import { Layer } from "@/utils/zindex";

export function SearchForm() {
    return (
        <div className="absolute top-0 left-0 right-0 bottom-0 backdrop-blur-md flex items-center justify-center" style={{ zIndex: Layer.SearchOverlay }}>
            <input
                type="text"
                placeholder="Search"
                className="border border-gray-300 p-2 rounded-lg outline-none"
            />
        </div>
    );
}
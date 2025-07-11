import FilledButton from "./buttons/FilledButton";

export default function JoinGroup() {
    return (
        <div className="flex gap-2">
            <input required
                className="w-full border border-[var(--primary-gray)] rounded-[10px] p-4 text-sm bg-transparent focus:border-[var(--primary-color)] focus:outline-none"
                placeholder="Enter a group code"
                type="text" />
            <FilledButton label="Join"/>
        </div>
    )
}
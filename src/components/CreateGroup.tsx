import FilledButton from "./buttons/FilledButton"

export default function CreateGroup() {
    return (
        <div className="flex gap-2">
            <input required
                className="w-full border border-[var(--primary-gray)] rounded-[10px] p-4 text-sm bg-transparent focus:border-[var(--primary-color)]"
                placeholder="Enter a name for your group"
                type="text" />
            <FilledButton label="Create"/>
        </div>
    )
}
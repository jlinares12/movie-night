import OutlinedButton from "../buttons/OutlinedButton";
import FilledButton from "../buttons/FilledButton";
import WarningButton from "../buttons/DangerButton";

export default function GroupLinkSkeleton() {
    return (
        <div className="grid grid-cols-3 items-center pb-8 pt-8">
            <div className="cl-group-name w-64 h-12 rounded-[10px] bg-[var(--primary-gray)] animate-pulse">
            </div>
            <div className="flex flex-col h-12 gap-2">
                <div className="w-[50%] h-[20px] bg-[var(--primary-gray)] rounded-lg animate-pulse">
                </div>
                <div className="w-[50%] h-[20px] bg-[var(--primary-gray)] rounded-lg animate-pulse">
                </div>
            </div>
            <div className="flex gap-2">
                <OutlinedButton label="Nominate Movie" isDisabled={true}/>
                <FilledButton label="Open" isDisabled={true}/>
                <WarningButton label="Leave Group" isDisabled={true}/>
            </div>
        </div>
    )
}
import OutlinedButton from "./buttons/OutlinedButton";
import FilledButton from "./buttons/FilledButton";
import WarningButton from "./buttons/DangerButton";

interface Props {
    key: number;
    name: string;
    user_count: number;
    date: string;
}

export default function GroupLink({name, user_count, date}:Props) {
    return (
        <div className="grid grid-cols-3 items-center pb-8 pt-8">
            <div className="flex">
                <div className="cl-group-name text-2xl text-[var(--name-color)] font-extrabold">
                    <h1>{name}</h1>
                </div>
            </div>
            <div>
                <div className="text-sm text-[var(--member-color)]">
                    <p>{user_count} members</p>
                </div>
                <div className="text-sm text-[var(--text-color)]">
                    <p>Date: {date}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <OutlinedButton label="Nominate Movie"/>
                <FilledButton label="Open"/>
                <WarningButton label="Leave Group"/>
            </div>
        </div>
    )
}
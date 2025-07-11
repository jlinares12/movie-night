interface Props {
    key: number;
    name: string;
    user_count: number;
    date: string;
}

export default function GroupLink({name, user_count, date}:Props) {
    return (
        <div className="flex flex-col p-4">
            <div className="cl-group-name text-2xl text-[var(--name-color)]">
                <h1>{name}</h1>
            </div>
            <div className="text-sm text-[var(--member-color)]">
                <p>{user_count} members</p>
            </div>
            <div className="text-sm text-[var(--text-color)]">
                <p>Date: {date}</p>
            </div>
        </div>
    )
}
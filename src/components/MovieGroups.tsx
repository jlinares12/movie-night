import { useState, useEffect } from "react";
import GroupLinkSkeleton from "./skeletons/GroupLinkSkeleton";
import GroupLink from "./GroupLink";
import api from "../utils/api";

interface Group {
    id: number;
    name: string;
    user_count: number;
    date: string;
}

export default function MovieGroups() {
  const [data, setData] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  let intervalId: ReturnType<typeof setInterval>;

  const fetchAPI = async () => {
    try {
        const response = await api.get<Group[]>("api/groups");
        setData(response.data);
        setLoading(false);
        if (response.data.length >= 0) {
            clearInterval(intervalId);
        }
    } catch (err: any) {
        if (err?.response?.status === 401) {
            clearInterval(intervalId);
        }
        setLoading(true);
    }
  };

  fetchAPI();
  intervalId = setInterval(fetchAPI, 2000);
  return () => clearInterval(intervalId);
}, []);

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="w-full justify-self-start">
                {loading ? (
                    <div className="divide-y divide-[var(--primary-gray)]">
                        <GroupLinkSkeleton/>
                        <GroupLinkSkeleton/>
                    </div>
                ) : (
                <ul className="list-none divide-y divide-[var(--primary-gray)]">
                    {data.map((group) => (
                        <GroupLink
                            key={group["id"]}
                            name={group["name"]}
                            user_count={group["user_count"] as number}
                            date={group["date"]}/>
                    ))}
                </ul>
                )}
            </div>
        </div>
    )
}
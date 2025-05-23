import Link from "next/link";

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <section>
            <Link href={'#'}>Test</Link>
            <main>{children}</main>
        </section>
    )
};
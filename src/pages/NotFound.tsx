import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <>
            <h1>Error 404: Page not found</h1>
            <Link to={"/"}>
                <button>Go back home</button>
            </Link>
        </>
    )
}
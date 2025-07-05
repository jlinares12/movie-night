import { Link, Outlet } from "react-router-dom";
import MovieClapper from "../../components/icons/MovieClapper"

export default function AuthenticationLayout() {
  return (
    <div className="flex flex-col h-screen justify-between">
      <div className="h-screen bg-[var(--bk-color)] text-[var(--text-color)] flex items-center justify-center gap-[10em]">
        <div className="flex flex-col items-center justify-center gap-[2rem]">
          <h1 className="text-5xl font-bold text-[var(--primary-color)]">Movie Nights</h1>
          <div className="w-[300px] h-[250px]">
            <MovieClapper color="#40d952" className=""/>
          </div>
        </div>
        <Outlet />
      </div>
      <footer className="h-10 flex align-center justify-center bg-[var(--bk-color)] gap-[2rem] h-[60px] text-white text-xs">
        <Link to={'#'}>About</Link>
        <Link to={'#'}>Github</Link>
        <Link to={'#'}>Contact us</Link>
        <Link to={'#'}>Privacy</Link>
      </footer>
    </div>
  )
};

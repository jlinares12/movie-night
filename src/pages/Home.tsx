import MovieGroups from "../components/MovieGroups";

export default function Home(){
  return (
    <div className="grid grid-flow-row grid-row-2 gap-12">
      <div className="w-[910px] border border-[var(--primary-color)] p-8">
        <MovieGroups/>
      </div>
      <div className="flex justify-between">
        <div className="w-[425px] h-[350px] bg-[var(--primary-color)]">

        </div>
        <div className="w-[425px] h-[350px] bg-[var(--primary-color)]">

        </div>
      </div>
    </div>
  )
};

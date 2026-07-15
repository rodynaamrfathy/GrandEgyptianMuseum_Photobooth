import LoadingState from "./components/LoadingState";

export default function Loading(): JSX.Element {
  return (
    <div className="flex flex-col min-h-screen font-greta-sans relative">
      <div className="flex flex-col flex-1 items-center justify-center">
        <LoadingState />
      </div>
    </div>
  );
}
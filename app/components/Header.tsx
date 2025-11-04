import Link from "next/link";

export interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => (
  <header className={"header"}>
    <div className={"container"}>
      <h1 className={"title"}>
        <Link href={"/"} className={"link"}>
          #!/{title}
        </Link>
      </h1>
    </div>
  </header>
);

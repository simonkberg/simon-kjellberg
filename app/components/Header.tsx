import Link from "next/link";

import { config } from "@/config";

export interface HeaderProps {
  section?: string;
}

export const Header = ({ section }: HeaderProps) => (
  <header className="header">
    <div className="container">
      <h1 className="title">
        <Link href="/" className="link">
          #!/{config.title}
          {section && `/${section}`}
        </Link>
      </h1>
    </div>
  </header>
);

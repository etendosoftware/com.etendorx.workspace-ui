"use client";
import GoogleIcon from "../../../ComponentLibrary/src/assets/icons/ilustration/google.svg";
import MicrosoftIcon from "../../../ComponentLibrary/src/assets/icons/microsoft.svg";
import GithubIcon from "../../../ComponentLibrary/src/assets/icons/github.svg";
import FacebookIcon from "../../../ComponentLibrary/src/assets/icons/facebook.svg";
import LinkedinIcon from "../../../ComponentLibrary/src/assets/icons/linkedin.svg";

type Provider = { id: string; name: string };

const PROVIDER_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  google: GoogleIcon,
  microsoft: MicrosoftIcon,
  github: GithubIcon,
  facebook: FacebookIcon,
  linkedin: LinkedinIcon,
};

// google/microsoft are full-color; the rest ship as single-color glyphs that must
// be tinted to the app's baseline (their raw svgs use an invalid fill="current").
const MONOCHROME = new Set(["github", "facebook", "linkedin"]);

const label = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

/** A single, evenly-spaced row of square SSO provider buttons (login + profile linking). */
export default function ProviderIconButtons({
  providers,
  onSelect,
}: {
  providers: Provider[];
  onSelect: (providerId: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {providers.map((provider) => {
        const Icon = PROVIDER_ICONS[provider.name];
        return (
          <button
            key={provider.id}
            type="button"
            title={label(provider.name)}
            aria-label={label(provider.name)}
            onClick={() => onSelect(provider.id)}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-(--color-transparent-neutral-10) bg-(--color-baseline-0) transition-all duration-150 hover:border-(--color-transparent-neutral-20) hover:bg-(--color-baseline-10) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-etendo-main) focus-visible:ring-offset-2"
            data-testid={`SSOProvider__${provider.name}`}>
            {Icon ? (
              <Icon
                className={`h-6 w-6 ${MONOCHROME.has(provider.name) ? "[&_path]:fill-(--color-baseline-100)" : ""}`}
                data-testid="Icon__589f72"
              />
            ) : (
              <span className="text-xs font-medium">{label(provider.name)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

import { BouncingDots } from "./BoucingDots";
import { Button, type ButtonProps } from "./Button";

interface LoadingButtonProps extends ButtonProps {
  isLoading: boolean;
}

export function LoadingButton(props: LoadingButtonProps) {
  if (props.isLoading) {
    return (
      <Button {...props} disabled>
        <BouncingDots colorClass="bg-white/80" />
      </Button>
    );
  }

  return <Button {...props} />;
}

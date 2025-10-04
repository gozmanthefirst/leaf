import { useIsRestoring } from "@tanstack/react-query";

type WithStateProps<T> = {
  state: {
    isLoading?: boolean;
    isError?: boolean;
    isEmpty?: boolean;
    data?: T;
  };
  loading?: React.ReactNode;
  error?: React.ReactNode;
  empty?: React.ReactNode;
  children: React.ReactNode | ((data: T) => React.ReactNode);
};

const WithState = <T,>({
  state,
  loading,
  error,
  empty,
  children,
}: WithStateProps<T>) => {
  const isRestoring = useIsRestoring();

  if (state.isLoading || isRestoring) return loading ?? null;
  // When a query fails, useQuery always tries to refetch it, and if it keeps on failing and refetching, the user gets a see the UI toggling between the error state and loading state.
  // To provide a quick solution to this right now, we will never show the error state in production.
  // For now, this will do.
  if (state.isError)
    return import.meta.env.PROD ? (loading ?? null) : (error ?? null);
  if (
    state.isEmpty ||
    !state.data ||
    (Array.isArray(state.data) && !state.data.length) ||
    (typeof state.data === "object" && Object.keys(state.data).length === 0)
  )
    return empty ?? null;

  return typeof children === "function" ? children(state.data as T) : children;
};

export { WithState };

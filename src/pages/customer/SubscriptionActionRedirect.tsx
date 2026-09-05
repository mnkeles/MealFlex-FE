import { Navigate, useParams } from "react-router-dom";

/** Existing subscription detail page owns change, pause and live-delivery state to keep a single source of truth. */
export default function SubscriptionActionRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate replace to={`/subscriptions/${id}#deliveries`} />;
}

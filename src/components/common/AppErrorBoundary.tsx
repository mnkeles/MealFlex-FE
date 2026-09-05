import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Hata izleme sağlayıcısı yapılandırıldığında burada raporlanır.
    void _error;
    void _info;
  }
  render() {
    if (this.state.failed)
      return (
        <main
          className="mx-auto mt-20 max-w-lg rounded-2xl border border-danger-100 bg-white p-8 text-center shadow-sm"
          role="alert"
        >
          <h1 className="text-xl font-bold text-slate-900">
            Bir şeyler ters gitti
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            İşleminiz tamamlanamadı. Sayfayı yeniden deneyebilir veya biraz
            sonra tekrar gelebilirsiniz.
          </p>
          <button
            onClick={() => this.setState({ failed: false })}
            className="mt-6 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Tekrar dene
          </button>
        </main>
      );
    return this.props.children;
  }
}

import { expect, test } from "@playwright/test";
import type { UseQueryResult } from "@tanstack/react-query";
import QueryBoundary from "../src/components/ui/QueryBoundary";

type ComponentNode = { props: Record<string, unknown> };

function queryState<T>(state: Partial<UseQueryResult<T>>): UseQueryResult<T> {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: async () => ({}) as never,
    ...state,
  } as UseQueryResult<T>;
}

function renderBoundary<T>(query: UseQueryResult<T>, options: Record<string, unknown> = {}) {
  return QueryBoundary<T>({ query, children: (data) => data as never, ...options } as never) as ComponentNode;
}

test.describe("QueryBoundary component", () => {
  test("yükleme durumunu ortak erişilebilir durum alanında gösterir", () => {
    const node = renderBoundary(queryState<string[]>({ isLoading: true }), { loadingLabel: "Liste hazırlanıyor" });
    const loading = node.props.children as ComponentNode;
    expect(loading.props.role).toBe("status");
    expect(loading.props.children).toBe("Liste hazırlanıyor");
  });

  test("hata durumunda yeniden deneme işlemini gösterir", () => {
    const node = renderBoundary(queryState<string[]>({ isError: true }), { errorTitle: "Liste yüklenemedi" });
    expect(node.props.title).toBe("Liste yüklenemedi");
    expect(node.props.action).toBeTruthy();
  });

  test("boş veri için ortak boş durumu gösterir", () => {
    const node = renderBoundary(queryState<string[]>({ data: [] }), { isEmpty: (items: string[]) => items.length === 0, emptyTitle: "Kayıt yok" });
    expect(node.props.title).toBe("Kayıt yok");
  });

  test("başarılı veriyi render fonksiyonuna aktarır", () => {
    const data = ["MealFlex"];
    const node = renderBoundary(queryState({ data }));
    expect(node.props.children).toBe(data);
  });
});

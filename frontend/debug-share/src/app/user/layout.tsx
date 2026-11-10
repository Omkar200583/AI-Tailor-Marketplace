// Customer portal root. Route groups below decide the chrome:
//   (shop)    public storefront   → navbar + footer
//   (auth)    login / register    → split-screen auth frame
//   (account) signed-in area      → server role guard + customer shell
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

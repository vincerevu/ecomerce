import type { ReactNode } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import ProductEditor from "./pages/ProductEditor";
import Collections from "./pages/Collections";
import CollectionDetails from "./pages/CollectionDetails";
import CollectionEditor from "./pages/CollectionEditor";
import Team from "./pages/Team";
import TeamDetails from "./pages/TeamDetails";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import CustomerEditor from "./pages/CustomerEditor";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import Categories from "./pages/Categories";
import CategoryDetails from "./pages/CategoryDetails";
import CategoryEditor from "./pages/CategoryEditor";
import Inventory from "./pages/Inventory";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PermissionGuard from "./components/auth/PermissionGuard";
import AccessDenied from "./components/auth/AccessDenied";

function withPermission(element: ReactNode, permission: string | string[]) {
  return (
    <PermissionGuard permission={permission} fallback={<AccessDenied />}>
      {element}
    </PermissionGuard>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerStyle={{ zIndex: 99999 }}
      />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Home />} />

              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />

              <Route path="/form-elements" element={<FormElements />} />

              <Route path="/basic-tables" element={<BasicTables />} />
              <Route path="/orders" element={withPermission(<Orders />, "ORDER:VIEW")} />
              <Route path="/orders/:orderId" element={withPermission(<OrderDetails />, "ORDER:VIEW")} />
              <Route path="/products" element={withPermission(<Products />, "PRODUCT:VIEW")} />
              <Route path="/products/:productId" element={withPermission(<ProductDetails />, "PRODUCT:VIEW")} />
              <Route path="/products/new" element={withPermission(<ProductEditor />, "PRODUCT:CREATE")} />
              <Route path="/products/:productId/edit" element={withPermission(<ProductEditor />, "PRODUCT:UPDATE")} />
              <Route path="/collections" element={withPermission(<Collections />, "COLLECTION:VIEW")} />
              <Route path="/collections/:collectionId" element={withPermission(<CollectionDetails />, "COLLECTION:VIEW")} />
              <Route path="/collections/new" element={withPermission(<CollectionEditor />, "COLLECTION:CREATE")} />
              <Route path="/collections/:collectionId/edit" element={withPermission(<CollectionEditor />, "COLLECTION:UPDATE")} />
              <Route path="/categories" element={withPermission(<Categories />, "CATEGORY:VIEW")} />
              <Route path="/categories/:categoryId" element={withPermission(<CategoryDetails />, "CATEGORY:VIEW")} />
              <Route path="/categories/new" element={withPermission(<CategoryEditor />, "CATEGORY:CREATE")} />
              <Route path="/categories/:categoryId/edit" element={withPermission(<CategoryEditor />, "CATEGORY:UPDATE")} />
              <Route path="/inventory" element={withPermission(<Inventory />, "INVENTORY:VIEW")} />
              <Route path="/team" element={withPermission(<Team />, "USER:VIEW")} />
              <Route path="/team/:staffId" element={withPermission(<TeamDetails />, "USER:VIEW")} />
              <Route path="/customers" element={withPermission(<Customers />, "USER:VIEW")} />
              <Route path="/customers/new" element={withPermission(<CustomerEditor />, "USER:CREATE")} />
              <Route path="/customers/:customerId" element={withPermission(<CustomerDetails />, "USER:VIEW")} />
              <Route path="/customers/:customerId/edit" element={withPermission(<CustomerEditor />, "USER:UPDATE")} />
              <Route path="/roles" element={withPermission(<Roles />, "ROLE:VIEW")} />
              <Route path="/permissions" element={withPermission(<Permissions />, "PERMISSION:VIEW")} />

              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />
            </Route>
          </Route>

          <Route path="/signin" element={<SignIn />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

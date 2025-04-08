import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/layout/layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CreateListing from "@/pages/create-listing";
import Confirmation from "@/pages/confirmation";
import ListingView from "@/pages/listing-view";
import MyListings from "@/pages/my-listings";
import PopularListings from "@/pages/popular-listings";
import MapView from "@/pages/map-view";
import Explore from "@/pages/explore";
import Login from "@/pages/login";
import Signup from "@/pages/signup";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/create" component={CreateListing} />
        <Route path="/confirmation/:id" component={Confirmation} />
        <Route path="/l/:id" component={ListingView} />
        <Route path="/my-listings" component={MyListings} />
        <Route path="/popular" component={PopularListings} />
        <Route path="/map" component={MapView} />
        <Route path="/explore" component={Explore} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

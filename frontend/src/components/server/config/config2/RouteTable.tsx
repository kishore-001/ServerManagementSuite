// components/server/config2/RouteTable.tsx
import React, { useState } from "react";
import {
  FaRoute,
  FaTrash,
  FaPlus,
  FaFlag,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useConfig2 } from "../../../../hooks/server/useConfig2";
import RouteModal from "./RouteModal";
import "./RouteTable.css";

interface Route {
  destination: string;
  gateway: string;
  iface: string;
  metric: string;
  genmask: string;
  flags: string;
  ref: string;
  use: string;
}

interface RouteUpdateData {
  action: string;
  destination: string;
  gateway: string;
  interface?: string;
  metric?: string;
}

const RouteTable: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { routeTable, loading, error, updateRoute } = useConfig2();

  const handleAddRoute = async (routeData: RouteUpdateData) => {
    try {
      const success = await updateRoute(routeData);
      if (success) {
        return true;
      }
      return false;
    } catch (err) {
      // Error notification is already handled by the hook
      return false;
    }
  };

  // ✅ Enhanced delete route with better error handling
  const handleDeleteRoute = async (route: Route) => {
    // Format destination with CIDR notation for deletion
    const formattedDestination = formatDestination(
      route.destination,
      route.genmask,
    );

    if (
      window.confirm(
        `Are you sure you want to delete route to ${formattedDestination}?`,
      )
    ) {
      try {
        const success = await updateRoute({
          action: "delete",
          destination: formattedDestination, // ✅ Includes CIDR notation
          gateway: route.gateway === "*" ? "0.0.0.0" : route.gateway,
          interface: route.iface !== "-" ? route.iface : undefined,
          metric: route.metric !== "-" ? route.metric : undefined,
        });

        if (success) {
          // Route table will be automatically refreshed by the hook
          return;
        }
      } catch (err) {
        // Error notification is already handled by the hook
        console.error("Failed to delete route:", err);
      }
    }
  };

  // ✅ Enhanced formatDestination function
  const formatDestination = (destination: string, genmask: string): string => {
    // Handle default route
    if (destination === "0.0.0.0" && genmask === "0.0.0.0") {
      return "0.0.0.0/0";
    }

    // Handle localhost/loopback
    if (destination === "127.0.0.0" && genmask === "255.0.0.0") {
      return "127.0.0.0/8";
    }

    // Handle link-local
    if (destination === "169.254.0.0" && genmask === "255.255.0.0") {
      return "169.254.0.0/16";
    }

    // Convert netmask to CIDR
    const cidr = netmaskToCidr(genmask);
    if (cidr !== null) {
      return `${destination}/${cidr}`;
    }

    // Fallback: if we can't determine CIDR, assume /32 for host routes
    return `${destination}/32`;
  };

  // ✅ Enhanced netmask to CIDR conversion
  const netmaskToCidr = (netmask: string): number | null => {
    const netmaskMap: { [key: string]: number } = {
      "255.255.255.255": 32,
      "255.255.255.254": 31,
      "255.255.255.252": 30,
      "255.255.255.248": 29,
      "255.255.255.240": 28,
      "255.255.255.224": 27,
      "255.255.255.192": 26,
      "255.255.255.128": 25,
      "255.255.255.0": 24,
      "255.255.254.0": 23,
      "255.255.252.0": 22,
      "255.255.248.0": 21,
      "255.255.240.0": 20,
      "255.255.224.0": 19,
      "255.255.192.0": 18,
      "255.255.128.0": 17,
      "255.255.0.0": 16,
      "255.254.0.0": 15,
      "255.252.0.0": 14,
      "255.248.0.0": 13,
      "255.240.0.0": 12,
      "255.224.0.0": 11,
      "255.192.0.0": 10,
      "255.128.0.0": 9,
      "255.0.0.0": 8,
      "254.0.0.0": 7,
      "252.0.0.0": 6,
      "248.0.0.0": 5,
      "240.0.0.0": 4,
      "224.0.0.0": 3,
      "192.0.0.0": 2,
      "128.0.0.0": 1,
      "0.0.0.0": 0,
    };
    return netmaskMap[netmask] ?? null;
  };

  // ✅ Enhanced flag description with more flags
  const getFlagDescription = (flags: string): string => {
    const flagMap: { [key: string]: string } = {
      U: "Up (route is up)",
      G: "Gateway (use gateway)",
      H: "Host (target is a host)",
      R: "Reinstate (reinstate route for dynamic routing)",
      D: "Dynamic (dynamically installed by daemon)",
      M: "Modified (modified from routing daemon)",
      A: "Addrconf (installed by addrconf)",
      C: "Cache (cache entry)",
      "!": "Reject (reject route)",
      L: "Linkroute (route to link)",
      B: "Broadcast (broadcast route)",
      l: "Local (local route)",
      S: "Static (static route)",
    };

    return flags
      .split("")
      .map((flag) => flagMap[flag] || `Unknown (${flag})`)
      .join(", ");
  };

  // ✅ Helper function to display destination in table
  const getDisplayDestination = (
    destination: string,
    genmask: string,
  ): string => {
    if (destination === "0.0.0.0" && genmask === "0.0.0.0") {
      return "default";
    }

    const cidr = netmaskToCidr(genmask);
    return cidr !== null ? `${destination}/${cidr}` : destination;
  };

  // ✅ Helper function to get route type badge
  const getRouteType = (
    destination: string,
    genmask: string,
    flags: string,
  ): string => {
    if (destination === "0.0.0.0" && genmask === "0.0.0.0") {
      return "default";
    }
    if (flags.includes("H")) {
      return "host";
    }
    if (flags.includes("G")) {
      return "gateway";
    }
    return "network";
  };

  // ✅ Enhanced loading state
  if (loading.routeTable && routeTable.length === 0) {
    return (
      <div className="route-table-card">
        <div className="route-table-loading">
          <div className="route-table-loading-spinner">
            <FaSpinner className="spinning" />
          </div>
          <p>Loading route table...</p>
        </div>
      </div>
    );
  }

  // ✅ Enhanced error state
  if (error && routeTable.length === 0) {
    return (
      <div className="route-table-card">
        <div className="route-table-error">
          <div className="route-table-error-icon">
            <FaExclamationTriangle />
          </div>
          <div className="route-table-error-content">
            <h4>Failed to Load Route Table</h4>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="route-table-card">
      <div className="route-table-header">
        <div className="route-table-title-section">
          <div className="route-table-icon-wrapper">
            <FaRoute className="route-table-icon" />
          </div>
          <div>
            <h3 className="route-table-title">Route Table</h3>
            <p className="route-table-description">
              Manage network routing ({routeTable.length} routes)
            </p>
          </div>
        </div>
        <button
          className="route-table-add-btn"
          onClick={() => setShowModal(true)}
          disabled={loading.updating}
          title="Add new route"
        >
          {loading.updating ? (
            <FaSpinner className="spinning" />
          ) : (
            <FaPlus className="route-table-add-icon" />
          )}
          Add Route
        </button>
      </div>

      <div className="route-table-content">
        <div className="route-table-container">
          {routeTable.length === 0 ? (
            <div className="route-table-empty">
              <FaRoute className="route-table-empty-icon" />
              <p>No routes configured</p>
              <small>Click "Add Route" to create your first route</small>
            </div>
          ) : (
            <div className="route-table-wrapper">
              <table className="route-table">
                <thead>
                  <tr>
                    <th>Destination</th>
                    <th>Gateway</th>
                    <th>Interface</th>
                    <th>Type</th>
                    <th>Flags</th>
                    <th>Metric</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {routeTable.map((route, index) => (
                    <tr key={index} className="route-table-row">
                      <td className="route-table-destination">
                        <span className="route-destination-text">
                          {getDisplayDestination(
                            route.destination,
                            route.genmask,
                          )}
                        </span>
                      </td>
                      <td className="route-table-gateway">
                        <span
                          className={`route-gateway-text ${route.gateway === "*" ? "direct" : "gateway"}`}
                        >
                          {route.gateway === "*" ? "Direct" : route.gateway}
                        </span>
                      </td>
                      <td className="route-table-interface">
                        <span className="route-interface-badge">
                          {route.iface}
                        </span>
                      </td>
                      <td className="route-table-type">
                        <span
                          className={`route-type-badge ${getRouteType(route.destination, route.genmask, route.flags)}`}
                        >
                          {getRouteType(
                            route.destination,
                            route.genmask,
                            route.flags,
                          )}
                        </span>
                      </td>
                      <td className="route-table-flags">
                        <span
                          className="route-flags-badge"
                          title={getFlagDescription(route.flags)}
                        >
                          <FaFlag className="route-flags-icon" />
                          {route.flags}
                        </span>
                      </td>
                      <td className="route-table-metric">
                        <span className="route-metric-text">
                          {route.metric}
                        </span>
                      </td>
                      <td className="route-table-actions">
                        <button
                          className="route-table-delete-btn"
                          onClick={() => handleDeleteRoute(route)}
                          disabled={loading.updating}
                          title="Delete Route"
                        >
                          {loading.updating ? (
                            <FaSpinner className="spinning" />
                          ) : (
                            <FaTrash />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ✅ Loading indicator when updating */}
        {loading.updating && (
          <div className="route-table-updating">
            <FaSpinner className="spinning" />
            <span>Updating routes...</span>
          </div>
        )}
      </div>

      <RouteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddRoute={handleAddRoute}
        isLoading={loading.updating}
      />
    </div>
  );
};

export default RouteTable;

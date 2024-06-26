import { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import { AttachMoneyOutlined, BarChartOutlined, LineStyleOutlined, LocalOfferOutlined, ReceiptOutlined, StackedBarChartOutlined } from "@mui/icons-material";
import SecondaryTabs from '../../../../../ComponentLibrary/src/components/SecondaryTabs';

export default {
  title: 'Components/SecondaryTabs',
  component: SecondaryTabs,
};

const initialTabsConfig = [
  {
    icon: <LineStyleOutlined />,
    label: "Lines",
    numberOfItems: 20,
    isLoading: true,
    onClick: () => console.log("Navigating to Lines"),
    content: <Typography>Lines Content</Typography>,
  },
  {
    icon: '🏬',
    label: "Discounts",
    numberOfItems: 0,
    onClick: () => console.log("Navigating to Discounts"),
    content: <Typography>Discounts Content</Typography>,
  },
  {
    icon: <StackedBarChartOutlined />,
    label: "Tax",
    numberOfItems: 2,
    isLoading: true,
    onClick: () => console.log("Navigating to Tax"),
    content: <Typography>Tax Content</Typography>,
  },
  {
    icon: '🇦🇷',
    label: "Payment Plan",
    numberOfItems: 0,
    onClick: () => console.log("Navigating to Payment Plan"),
    content: <Typography>Payment Plan Content</Typography>,
  },
  {
    icon: <ReceiptOutlined />,
    label: "Sales Order",
    numberOfItems: 12,
    isLoading: true,
    onClick: () => console.log("Navigating to Sales Order"),
    content: <Typography>Sales Order Content</Typography>,
  },
  {
    icon: '📦',
    label: "Purchases",
    numberOfItems: 3,
    onClick: () => console.log("Navigating to Purchases"),
    content: <Typography>Purchases Content</Typography>,
  },
  {
    icon: <BarChartOutlined />,
    label: "Reports",
    numberOfItems: 8,
    onClick: () => console.log("Navigating to Reports"),
    content: <Typography>Reports Content</Typography>,
  },
  {
    icon: <AttachMoneyOutlined />,
    label: "Finance",
    numberOfItems: 6,
    onClick: () => console.log("Navigating to Finance"),
    content: <Typography>Finance Content</Typography>,
  },
  {
    icon: <LineStyleOutlined />,
    label: "Projects",
    numberOfItems: 5,
    onClick: () => console.log("Navigating to Projects"),
    content: <Typography>Projects Content</Typography>,
  },
  {
    icon: <LocalOfferOutlined />,
    label: "Marketing",
    numberOfItems: 4,
    onClick: () => console.log("Navigating to Marketing"),
    content: <Typography>Marketing Content</Typography>,
  },
  {
    icon: <StackedBarChartOutlined />,
    label: "Analysis",
    numberOfItems: 7,
    onClick: () => console.log("Navigating to Analysis"),
    content: <Typography>Analysis Content</Typography>,
  },
  {
    icon: '🇪🇸',
    label: "World",
    numberOfItems: 9,
    onClick: () => console.log("Navigating to World"),
    content: <Typography>Portfolio Content</Typography>,
  },
  {
    icon: <ReceiptOutlined />,
    label: "Billing",
    numberOfItems: 11,
    onClick: () => console.log("Navigating to Billing"),
    content: <Typography>Billing Content</Typography>,
  },
];

const SecondaryTabsTemplate = () => {
  const [tabsConfig, setTabsConfig] = useState(initialTabsConfig);

  useEffect(() => {
    const timer = setTimeout(() => {
      const updatedTabs: any = tabsConfig.map(tab => ({
        ...tab,
        isLoading: false,
      }));
      setTabsConfig(updatedTabs);
    }, 5000);
    return () => clearTimeout(timer);
  }, [tabsConfig]);

  return <SecondaryTabs tabsConfig={tabsConfig} />;
};

export const Default = () => <SecondaryTabsTemplate />;

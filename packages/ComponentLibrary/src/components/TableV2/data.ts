export const metadata = {
  "processes": [
    {
      "actionHandler": "org.openbravo.common.actionhandler.CopyFromOrdersActionHandler",
      "dynamicColumns": {},
      "popup": true,
      "processId": "8B81D80B06364566B87853FEECAB5DE0",
      "viewProperties": {
        "fields": [
          {
            "datasource": {
              "createClassName": "",
              "dataURL": "/etendo/org.openbravo.service.datasource/Organization",
              "fields": [
                {
                  "name": "id",
                  "primaryKey": true,
                  "type": "_id_13"
                },
                {
                  "name": "client",
                  "type": "_id_19"
                },
                {
                  "name": "client$_identifier"
                },
                {
                  "name": "active",
                  "type": "_id_20"
                },
                {
                  "name": "creationDate",
                  "type": "_id_16"
                },
                {
                  "name": "createdBy",
                  "type": "_id_30"
                },
                {
                  "name": "createdBy$_identifier"
                },
                {
                  "name": "updated",
                  "type": "_id_16"
                },
                {
                  "name": "updatedBy",
                  "type": "_id_30"
                },
                {
                  "name": "updatedBy$_identifier"
                },
                {
                  "name": "searchKey",
                  "type": "_id_10"
                },
                {
                  "name": "name",
                  "type": "_id_10"
                },
                {
                  "name": "description",
                  "type": "_id_10"
                },
                {
                  "name": "summaryLevel",
                  "type": "_id_20"
                },
                {
                  "name": "organizationType",
                  "type": "_id_19"
                },
                {
                  "name": "organizationType$_identifier"
                },
                {
                  "name": "allowPeriodControl",
                  "type": "_id_20"
                },
                {
                  "name": "calendar",
                  "type": "_id_19"
                },
                {
                  "name": "calendar$_identifier"
                },
                {
                  "name": "ready",
                  "type": "_id_28"
                },
                {
                  "name": "socialName",
                  "type": "_id_10"
                },
                {
                  "name": "currency",
                  "type": "_id_19"
                },
                {
                  "name": "currency$_identifier"
                },
                {
                  "name": "generalLedger",
                  "type": "_id_19"
                },
                {
                  "name": "generalLedger$_identifier"
                },
                {
                  "name": "aPRMGlitem",
                  "type": "_id_1A6C5E0A5868417786ECCF3C02B17D65"
                },
                {
                  "name": "aPRMGlitem$_identifier"
                },
                {
                  "name": "periodControlAllowedOrganization",
                  "type": "_id_100A788331734AE8BCC87BA0AC9E3406"
                },
                {
                  "name": "periodControlAllowedOrganization$_identifier"
                },
                {
                  "name": "calendarOwnerOrganization",
                  "type": "_id_100A788331734AE8BCC87BA0AC9E3406"
                },
                {
                  "name": "calendarOwnerOrganization$_identifier"
                },
                {
                  "name": "legalEntityOrganization",
                  "type": "_id_100A788331734AE8BCC87BA0AC9E3406"
                },
                {
                  "name": "legalEntityOrganization$_identifier"
                },
                {
                  "name": "inheritedCalendar",
                  "type": "_id_82C7F2AD834B493083D5DDAE50A01D0D"
                },
                {
                  "name": "inheritedCalendar$_identifier"
                },
                {
                  "name": "businessUnitOrganization",
                  "type": "_id_100A788331734AE8BCC87BA0AC9E3406"
                },
                {
                  "name": "businessUnitOrganization$_identifier"
                },
                {
                  "name": "extbpEnabled",
                  "type": "_id_20"
                },
                {
                  "name": "extbpConfig",
                  "type": "_id_49D83FCC4AF746BBB09D10DFCC61E0DF"
                },
                {
                  "name": "extbpConfig$_identifier"
                },
                {
                  "additional": true,
                  "name": "name",
                  "type": "_id_10"
                },
                {
                  "additional": true,
                  "name": "searchKey",
                  "type": "_id_10"
                }
              ],
              "requestProperties": {
                "params": {
                  "_extraProperties": "name,searchKey",
                  "columnName": "ad_org_id",
                  "Constants_FIELDSEPARATOR": "$",
                  "Constants_IDENTIFIER": "_identifier",
                  "IsSelectorItem": "true"
                }
              }
            },
            "defaultPopupFilterField": "name",
            "displayField": "_identifier",
            "extraSearchFields": ["name", "searchKey"],
            "name": "ad_org_id",
            "outFields": {},
            "outHiddenInputPrefix": "inpadOrgId",
            "paramId": "67D3A7BA80F7458B827BBC82373F4910",
            "pickListFields": [
              {
                "name": "_identifier",
                "title": " ",
                "type": "text"
              }
            ],
            "popupTextMatchStyle": "substring",
            "readOnlyIf": true,
            "required": false,
            "selectorDefinitionId": "BA3E7AE2C78E44AF890EDEFCDB76CD9A",
            "selectorGridFields": [
              {
                "name": "name",
                "showHover": true,
                "title": "name",
                "type": "_id_10"
              }
            ],
            "showSelectorGrid": true,
            "targetEntity": "Organization",
            "textMatchStyle": "substring",
            "title": "Legal Entity Organization",
            "type": "_id_EE3A1FFA879945C88957F4401BF15C0B",
            "valueField": "id",
            "width": "*"
          },
          {
            "displayedRowsNumber": 20,
            "name": "grid",
            "paramId": "87D3EC03AB7D474182E54CB2327E2125",
            "required": false,
            "showTitle": false,
            "title": "Pick/Edit Lines",
            "type": "OBPickEditGridItem",
            "viewProperties": {
              "dataSourceProperties": {
                "createClassName": "OBPickAndExecuteDataSource",
                "dataURL": "/etendo/org.openbravo.service.datasource/Order",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "active",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  },
                  {
                    "name": "salesTransaction",
                    "type": "_id_20"
                  },
                  {
                    "name": "documentNo",
                    "type": "_id_10"
                  },
                  {
                    "name": "documentStatus",
                    "type": "_id_FF80818130217A350130218D802B0011",
                    "valueMap": {
                      "??": "Unknown",
                      "AE": "Automatic Evaluation",
                      "CA": "Closed - Order Created",
                      "CJ": "Closed - Rejected",
                      "CL": "Closed",
                      "CO": "Booked",
                      "DR": "Draft",
                      "IP": "Under Way",
                      "ME": "Manual Evaluation",
                      "NA": "Not Accepted",
                      "NC": "Not Confirmed",
                      "RE": "Re-Opened",
                      "TMP": "Temporal",
                      "UE": "Under Evaluation",
                      "VO": "Voided",
                      "WP": "Not Paid"
                    }
                  },
                  {
                    "name": "documentAction",
                    "type": "_id_FF80818130217A35013021A672400035",
                    "valueMap": {
                      "--": "<None>",
                      "AP": "Approve",
                      "CL": "Close",
                      "CO": "Book",
                      "PO": "Post",
                      "PR": "Process",
                      "RA": "Reverse - Accrual",
                      "RC": "Void",
                      "RE": "Reactivate",
                      "RJ": "Reject",
                      "VO": "Void",
                      "XL": "Unlock"
                    }
                  },
                  {
                    "name": "processNow",
                    "type": "_id_28"
                  },
                  {
                    "name": "processed",
                    "type": "_id_20"
                  },
                  {
                    "name": "documentType",
                    "type": "_id_19"
                  },
                  {
                    "name": "documentType$_identifier"
                  },
                  {
                    "name": "transactionDocument",
                    "type": "_id_22F546D49D3A48E1B2B4F50446A8DE58"
                  },
                  {
                    "name": "transactionDocument$_identifier"
                  },
                  {
                    "name": "description",
                    "type": "_id_10"
                  },
                  {
                    "name": "delivered",
                    "type": "_id_20"
                  },
                  {
                    "name": "reinvoice",
                    "type": "_id_20"
                  },
                  {
                    "name": "print",
                    "type": "_id_20"
                  },
                  {
                    "name": "selected",
                    "type": "_id_20"
                  },
                  {
                    "name": "salesRepresentative",
                    "type": "_id_190"
                  },
                  {
                    "name": "salesRepresentative$_identifier"
                  },
                  {
                    "name": "orderDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "scheduledDeliveryDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "datePrinted",
                    "type": "_id_15"
                  },
                  {
                    "name": "accountingDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "businessPartner",
                    "type": "_id_800057"
                  },
                  {
                    "name": "businessPartner$_identifier"
                  },
                  {
                    "name": "invoiceAddress",
                    "type": "_id_159"
                  },
                  {
                    "name": "invoiceAddress$_identifier"
                  },
                  {
                    "name": "partnerAddress",
                    "type": "_id_19"
                  },
                  {
                    "name": "partnerAddress$_identifier"
                  },
                  {
                    "name": "orderReference",
                    "type": "_id_10"
                  },
                  {
                    "name": "printDiscount",
                    "type": "_id_20"
                  },
                  {
                    "name": "currency",
                    "type": "_id_19"
                  },
                  {
                    "name": "currency$_identifier"
                  },
                  {
                    "name": "formOfPayment",
                    "type": "_id_195",
                    "valueMap": {
                      "1": "Wire Transfer",
                      "2": "Check",
                      "3": "Promissory Note",
                      "4": "Money Order",
                      "5": "Bank Deposit",
                      "B": "Cash",
                      "C": "Cash on Delivery",
                      "K": "Credit Card",
                      "P": "On Credit",
                      "R": "Bank Remittance",
                      "W": "Withholding"
                    }
                  },
                  {
                    "name": "paymentTerms",
                    "type": "_id_19"
                  },
                  {
                    "name": "paymentTerms$_identifier"
                  },
                  {
                    "name": "invoiceTerms",
                    "type": "_id_150",
                    "valueMap": {
                      "D": "After Delivery",
                      "I": "Immediate",
                      "N": "Do Not Invoice",
                      "O": "After Order Delivered",
                      "S": "Customer Schedule After Delivery"
                    }
                  },
                  {
                    "name": "deliveryTerms",
                    "type": "_id_151",
                    "valueMap": {
                      "A": "Availability",
                      "L": "Complete Line",
                      "O": "Complete Order",
                      "R": "After Receipt"
                    }
                  },
                  {
                    "name": "freightCostRule",
                    "type": "_id_153",
                    "valueMap": {
                      "C": "Calculated",
                      "I": "Freight included"
                    }
                  },
                  {
                    "name": "freightAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "deliveryMethod",
                    "type": "_id_152",
                    "valueMap": {
                      "D": "Delivery",
                      "P": "Pickup",
                      "S": "Shipper"
                    }
                  },
                  {
                    "name": "shippingCompany",
                    "type": "_id_19"
                  },
                  {
                    "name": "shippingCompany$_identifier"
                  },
                  {
                    "name": "charge",
                    "type": "_id_200"
                  },
                  {
                    "name": "charge$_identifier"
                  },
                  {
                    "name": "chargeAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "priority",
                    "type": "_id_154",
                    "valueMap": {
                      "3": "High",
                      "5": "Medium",
                      "7": "Low"
                    }
                  },
                  {
                    "name": "summedLineAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "grandTotalAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "warehouse",
                    "type": "_id_263693E51C7847BF90C897ADB830E2BB"
                  },
                  {
                    "name": "warehouse$_identifier"
                  },
                  {
                    "name": "priceList",
                    "type": "_id_19"
                  },
                  {
                    "name": "priceList$_identifier"
                  },
                  {
                    "name": "priceIncludesTax",
                    "type": "_id_20"
                  },
                  {
                    "name": "salesCampaign",
                    "type": "_id_19"
                  },
                  {
                    "name": "salesCampaign$_identifier"
                  },
                  {
                    "name": "project",
                    "type": "_id_800061"
                  },
                  {
                    "name": "project$_identifier"
                  },
                  {
                    "name": "activity",
                    "type": "_id_19"
                  },
                  {
                    "name": "activity$_identifier"
                  },
                  {
                    "name": "posted",
                    "type": "_id_234",
                    "valueMap": {
                      "AD": "Post: No Accounting Date",
                      "b": "Post: Not Balanced",
                      "c": "Post: Not Convertible (no rate)",
                      "C": "Post: Error, No cost",
                      "D": "Post: Document Disabled",
                      "d": "Post: Disabled For Background",
                      "E": "Post: Error",
                      "i": "Post: Invalid Account",
                      "L": "Post: Document Locked",
                      "N": "Post",
                      "NC": "Post: Cost Not Calculated",
                      "NO": "Post: No Related PO",
                      "p": "Post: Period Closed",
                      "T": "Post: Table Disabled",
                      "Y": "Unpost",
                      "y": "Post: Post Prepared"
                    }
                  },
                  {
                    "name": "userContact",
                    "type": "_id_19"
                  },
                  {
                    "name": "userContact$_identifier"
                  },
                  {
                    "name": "copyFrom",
                    "type": "_id_28"
                  },
                  {
                    "name": "dropShipPartner",
                    "type": "_id_FF9658201F8B4BE780BE00AAA9499ED5"
                  },
                  {
                    "name": "dropShipPartner$_identifier"
                  },
                  {
                    "name": "dropShipLocation",
                    "type": "_id_159"
                  },
                  {
                    "name": "dropShipLocation$_identifier"
                  },
                  {
                    "name": "dropShipContact",
                    "type": "_id_110"
                  },
                  {
                    "name": "dropShipContact$_identifier"
                  },
                  {
                    "name": "selfService",
                    "type": "_id_20"
                  },
                  {
                    "name": "trxOrganization",
                    "type": "_id_130"
                  },
                  {
                    "name": "trxOrganization$_identifier"
                  },
                  {
                    "name": "stDimension",
                    "type": "_id_0E0D1661E18E4E05A118785A7CF146B8"
                  },
                  {
                    "name": "stDimension$_identifier"
                  },
                  {
                    "name": "ndDimension",
                    "type": "_id_1850A5390D97470EBB35A3A5F43AB533"
                  },
                  {
                    "name": "ndDimension$_identifier"
                  },
                  {
                    "name": "deliveryNotes",
                    "type": "_id_14"
                  },
                  {
                    "name": "incoterms",
                    "type": "_id_19"
                  },
                  {
                    "name": "incoterms$_identifier"
                  },
                  {
                    "name": "iNCOTERMSDescription",
                    "type": "_id_14"
                  },
                  {
                    "name": "generateTemplate",
                    "type": "_id_28"
                  },
                  {
                    "name": "deliveryLocation",
                    "type": "_id_159"
                  },
                  {
                    "name": "deliveryLocation$_identifier"
                  },
                  {
                    "name": "copyFromPO",
                    "type": "_id_28"
                  },
                  {
                    "name": "paymentMethod",
                    "type": "_id_19"
                  },
                  {
                    "name": "paymentMethod$_identifier"
                  },
                  {
                    "name": "fINPaymentPriority",
                    "type": "_id_19"
                  },
                  {
                    "name": "fINPaymentPriority$_identifier"
                  },
                  {
                    "name": "pickFromShipment",
                    "type": "_id_28"
                  },
                  {
                    "name": "receiveMaterials",
                    "type": "_id_28"
                  },
                  {
                    "name": "createInvoice",
                    "type": "_id_28"
                  },
                  {
                    "name": "returnReason",
                    "type": "_id_19"
                  },
                  {
                    "name": "returnReason$_identifier"
                  },
                  {
                    "name": "addOrphanLine",
                    "type": "_id_28"
                  },
                  {
                    "name": "asset",
                    "type": "_id_444F3B4F45544B9CA45E4035D49C1176"
                  },
                  {
                    "name": "asset$_identifier"
                  },
                  {
                    "name": "calculatePromotions",
                    "type": "_id_28"
                  },
                  {
                    "name": "costcenter",
                    "type": "_id_DEE6B917B36D4648B2DA729FC2872CF4"
                  },
                  {
                    "name": "costcenter$_identifier"
                  },
                  {
                    "name": "createOrder",
                    "type": "_id_28"
                  },
                  {
                    "name": "rejectReason",
                    "type": "_id_19"
                  },
                  {
                    "name": "rejectReason$_identifier"
                  },
                  {
                    "name": "validUntil",
                    "type": "_id_15"
                  },
                  {
                    "name": "quotation",
                    "type": "_id_800062"
                  },
                  {
                    "name": "quotation$_identifier"
                  },
                  {
                    "name": "reservationStatus",
                    "type": "_id_C3C19DE8AB3B42E78748E20D986FBBC9",
                    "valueMap": {
                      "CR": "Completely Reserved",
                      "NR": "Not Reserved",
                      "PR": "Partially Reserved"
                    }
                  },
                  {
                    "name": "createPOLines",
                    "type": "_id_28"
                  },
                  {
                    "name": "cashVAT",
                    "type": "_id_20"
                  },
                  {
                    "name": "pickfromreceipt",
                    "type": "_id_28"
                  },
                  {
                    "name": "cancelandreplace",
                    "type": "_id_28"
                  },
                  {
                    "name": "aPRMAddPayment",
                    "type": "_id_28"
                  },
                  {
                    "name": "confirmcancelandreplace",
                    "type": "_id_28"
                  },
                  {
                    "name": "cancelledorder",
                    "type": "_id_290"
                  },
                  {
                    "name": "cancelledorder$_identifier"
                  },
                  {
                    "name": "replacedorder",
                    "type": "_id_290"
                  },
                  {
                    "name": "replacedorder$_identifier"
                  },
                  {
                    "name": "iscancelled",
                    "type": "_id_20"
                  },
                  {
                    "name": "replacementorder",
                    "type": "_id_290"
                  },
                  {
                    "name": "replacementorder$_identifier"
                  },
                  {
                    "name": "externalBusinessPartnerReference",
                    "type": "_id_10"
                  },
                  {
                    "name": "deliveryStatus",
                    "type": "_id_11"
                  },
                  {
                    "name": "invoiceStatus",
                    "type": "_id_11"
                  },
                  {
                    "name": "paymentStatus",
                    "type": "_id_11"
                  },
                  {
                    "additional": true,
                    "name": "businessPartner$name",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "warehouse$name",
                    "type": "_id_10"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_className": "OBPickAndExecuteDataSource",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier"
                  }
                }
              },
              "entity": "Order",
              "fields": [
                {
                  "columnName": "AD_Org_ID",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 22,
                    "editorProps": {
                      "displayField": "_identifier",
                      "valueField": "id"
                    },
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 1
                  },
                  "hasDefaultValue": true,
                  "id": "D3758708EC3E4B0EB682057C1F5F57A0",
                  "inpColumnName": "inpadOrgId",
                  "name": "organization",
                  "refColumnName": "AD_Org_ID",
                  "required": true,
                  "sessionProperty": true,
                  "targetEntity": "Organization",
                  "title": "Organization",
                  "type": "_id_19",
                  "updatable": false
                },
                {
                  "columnName": "C_BPartner_ID",
                  "datasource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/F8DD408F2F3A414188668836F84C21AF",
                    "fields": [],
                    "requestProperties": {
                      "params": {
                        "_extraProperties": "category,value,creditAvailable,creditUsed,name,customer,bpid,vendor",
                        "adTabId": "3ACD18ADFBA8406086852B071250C481",
                        "columnName": "C_BPartner_ID",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "businessPartner"
                      }
                    }
                  },
                  "defaultPopupFilterField": "name",
                  "disabled": true,
                  "displayField": "name",
                  "extraSearchFields": ["value"],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 60,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 2
                  },
                  "id": "4E59727F6CB347A0AEB03CDA2CE06ADA",
                  "inpColumnName": "inpcBpartnerId",
                  "name": "businessPartner",
                  "outFields": {},
                  "outHiddenInputPrefix": "inpcBpartnerId",
                  "pickListFields": [
                    {
                      "name": "name",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "C_BPartner_ID",
                  "required": true,
                  "selectorDefinitionId": "862F54CB1B074513BD791C6789F4AA42",
                  "selectorGridFields": [
                    {
                      "name": "name",
                      "showHover": true,
                      "title": "Name",
                      "type": "_id_10"
                    },
                    {
                      "name": "value",
                      "showHover": true,
                      "title": "Value",
                      "type": "_id_10"
                    },
                    {
                      "filterOnKeypress": false,
                      "name": "creditAvailable",
                      "showHover": true,
                      "title": "Credit Line available",
                      "type": "_id_12"
                    },
                    {
                      "filterOnKeypress": false,
                      "name": "creditUsed",
                      "showHover": true,
                      "title": "Customer Balance",
                      "type": "_id_12"
                    },
                    {
                      "name": "customer",
                      "showHover": true,
                      "title": "Customer",
                      "type": "_id_20"
                    },
                    {
                      "name": "vendor",
                      "showHover": true,
                      "title": "Vendor",
                      "type": "_id_20"
                    },
                    {
                      "name": "category",
                      "showHover": true,
                      "title": "Category",
                      "type": "_id_10"
                    }
                  ],
                  "sessionProperty": true,
                  "showSelectorGrid": true,
                  "targetEntity": "BusinessPartner",
                  "textMatchStyle": "substring",
                  "title": "Business Partner",
                  "type": "_id_800057",
                  "valueField": "bpid"
                },
                {
                  "columnName": "DateOrdered",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 3
                  },
                  "hasDefaultValue": true,
                  "id": "65FE05E3909C457F9B58D482EF64E739",
                  "inpColumnName": "inpdateordered",
                  "length": 10,
                  "name": "orderDate",
                  "required": true,
                  "sessionProperty": true,
                  "title": "Order Date",
                  "type": "_id_15"
                },
                {
                  "columnName": "DocumentNo",
                  "disabled": true,
                  "firstFocusedField": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 30,
                    "length": 30,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 4
                  },
                  "id": "1A7E7754760F4141BEBC64FACC44BA5F",
                  "inpColumnName": "inpdocumentno",
                  "length": 30,
                  "name": "documentNo",
                  "required": true,
                  "title": "Document No.",
                  "type": "_id_10"
                },
                {
                  "columnName": "GrandTotal",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 5
                  },
                  "id": "D1602458E7564C0496614E288FE964B0",
                  "inpColumnName": "inpgrandtotal",
                  "name": "grandTotalAmount",
                  "required": true,
                  "sessionProperty": true,
                  "title": "Total Gross Amount",
                  "type": "_id_12",
                  "updatable": false
                },
                {
                  "columnName": "C_Currency_ID",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 22,
                    "editorProps": {
                      "displayField": "_identifier",
                      "valueField": "id"
                    },
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 6
                  },
                  "hasDefaultValue": true,
                  "id": "71D550E2D7BE4070A4F62A62958A942B",
                  "inpColumnName": "inpcCurrencyId",
                  "name": "currency",
                  "refColumnName": "C_Currency_ID",
                  "required": true,
                  "sessionProperty": true,
                  "targetEntity": "Currency",
                  "title": "Currency",
                  "type": "_id_19",
                  "updatable": false
                },
                {
                  "columnName": "IsSOTrx",
                  "disabled": true,
                  "gridProps": {
                    "autoFitWidth": false,
                    "canFilter": true,
                    "canGroupBy": false,
                    "canSort": true,
                    "editorProps": {
                      "showLabel": false,
                      "showTitle": false
                    },
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 7,
                    "width": "*",
                    "yesNo": true
                  },
                  "hasDefaultValue": true,
                  "id": "AC971A2C03994083B80832D794ABB769",
                  "inpColumnName": "inpissotrx",
                  "name": "salesTransaction",
                  "overflow": "visible",
                  "sessionProperty": true,
                  "title": "Sales Transaction",
                  "type": "_id_20",
                  "width": 1
                },
                {
                  "columnName": "Description",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 255,
                    "length": 255,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 8
                  },
                  "id": "B6FD9241B1544C249BB4DD2AD1EBA891",
                  "inpColumnName": "inpdescription",
                  "length": 255,
                  "name": "description",
                  "title": "Description",
                  "type": "_id_10"
                },
                {
                  "columnName": "POReference",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 20,
                    "length": 20,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 9
                  },
                  "id": "8E2D1E69A2E144FC807CFDBB5DDAF551",
                  "inpColumnName": "inpporeference",
                  "length": 20,
                  "name": "orderReference",
                  "title": "Order Reference",
                  "type": "_id_10"
                },
                {
                  "defaultValue": "Audit",
                  "itemIds": [
                    "creationDate",
                    "createdBy",
                    "updated",
                    "updatedBy"
                  ],
                  "name": "1000100001",
                  "personalizable": false,
                  "title": "Audit",
                  "type": "OBAuditSectionItem"
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "creationDate",
                  "personalizable": false,
                  "title": "Creation Date",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "createdBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "createdBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Created By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updated",
                  "personalizable": false,
                  "title": "Updated",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "updatedBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updatedBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Updated By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "name": "_notes_",
                  "personalizable": false,
                  "type": "OBNoteSectionItem"
                },
                {
                  "name": "_notes_Canvas",
                  "personalizable": false,
                  "type": "OBNoteCanvasItem"
                },
                {
                  "name": "_linkedItems_",
                  "personalizable": false,
                  "type": "OBLinkedItemSectionItem"
                },
                {
                  "name": "_linkedItems_Canvas",
                  "personalizable": false,
                  "type": "OBLinkedItemCanvasItem"
                },
                {
                  "name": "_attachments_",
                  "personalizable": false,
                  "type": "OBAttachmentsSectionItem"
                },
                {
                  "name": "_attachments_Canvas",
                  "personalizable": false,
                  "type": "OBAttachmentCanvasItem"
                }
              ],
              "gridProperties": {
                "alias": "e",
                "allowSummaryFunctions": true,
                "filterClause": false,
                "orderByClause": "documentNo desc"
              },
              "mapping250": "/CopyfromOrdersPE/CopyfromOrders",
              "moduleId": "0",
              "selectionType": "M",
              "showSelect": true,
              "standardProperties": {
                "inpkeyColumnId": "2161",
                "inpKeyName": "inpcOrderId",
                "inpTabId": "3ACD18ADFBA8406086852B071250C481",
                "inpTableId": "259",
                "inpwindowId": "A839712F8D5E4929BB2D057BAA55A2A3",
                "keyColumnName": "C_Order_ID",
                "keyProperty": "id",
                "keyPropertyType": "_id_13"
              },
              "statusBarFields": [],
              "tabId": "3ACD18ADFBA8406086852B071250C481",
              "tabTitle": "Copy from Orders"
            },
            "width": "*"
          }
        ]
      }
    },
    {
      "actionHandler": "org.openbravo.common.actionhandler.CancelAndReplaceSalesOrder",
      "dynamicColumns": {},
      "popup": true,
      "processId": "A2FAF49712D1445ABE750315CE1B473A",
      "viewProperties": {
        "fields": []
      }
    },
    {
      "actionHandler": "com.smf.jobs.defaults.ProcessOrders",
      "dynamicColumns": {},
      "onLoadFunction": "OB.Jobs.ProcessOrders.onLoad",
      "popup": true,
      "processId": "8DF818E471394C01A6546A4AB7F5E529",
      "viewProperties": {
        "fields": [
          {
            "length": 60,
            "name": "DocAction",
            "paramId": "893D14431B1A4607BEE141A7C7A98EFE",
            "required": true,
            "title": "Document Action",
            "type": "_id_FF80818130217A35013021A672400035",
            "valueMap": {
              "--": "<None>",
              "AP": "Approve",
              "CL": "Close",
              "CO": "Book",
              "PO": "Post",
              "PR": "Process",
              "RA": "Reverse - Accrual",
              "RC": "Void",
              "RE": "Reactivate",
              "RJ": "Reject",
              "VO": "Void",
              "XL": "Unlock"
            },
            "width": "*"
          }
        ]
      }
    },
    {
      "actionHandler": "org.openbravo.advpaymentmngt.actionHandler.AddPaymentActionHandler",
      "clientSideValidation": "OB.APRM.AddPayment.onProcess",
      "dynamicColumns": {},
      "onLoadFunction": "OB.APRM.AddPayment.onLoad",
      "popup": true,
      "processId": "9BED7889E1034FE68BD85D5D16857320",
      "viewProperties": {
        "fields": [
          {
            "name": "trxtype",
            "onChangeFunction": "OB.APRM.AddPayment.documentOnChange",
            "paramId": "6E03D970D07D4753941F7B06DAF197F3",
            "required": true,
            "title": "Document",
            "type": "_id_40B84CF78FC9435790887846CCDAE875",
            "valueMap": {
              "PDOUT": "Paid Out",
              "RCIN": "Received In"
            },
            "width": "*"
          },
          {
            "datasource": {
              "createClassName": "",
              "dataURL": "/etendo/org.openbravo.service.datasource/Organization",
              "fields": [
                {
                  "name": "id",
                  "primaryKey": true,
                  "type": "_id_13"
                },
                {
                  "name": "client",
                  "type": "_id_19"
                },
                {
                  "name": "client$_identifier"
                },
                {
                  "name": "active",
                  "type": "_id_20"
                },
                {
                  "name": "creationDate",
                  "type": "_id_16"
                },
                {
                  "name": "createdBy",
                  "type": "_id_30"
                },
                {
                  "name": "createdBy$_identifier"
                },
                {
                  "name": "updated",
                  "type": "_id_16"
                },
                {
                  "name": "updatedBy",
                  "type": "_id_30"
                },
                {
                  "name": "updatedBy$_identifier"
                },
                {
                  "name": "searchKey",
                  "type": "_id_10"
                },
                {
                  "name": "name",
                  "type": "_id_10"
                },
                {
                  "name": "description",
                  "type": "_id_10"
                },
                {
                  "name": "summaryLevel",
                  "type": "_id_20"
                },
                {
                  "name": "organizationType",
                  "type": "_id_19"
                },
                {
                  "name": "organizationType$_identifier"
                },
                {
                  "name": "allowPeriodControl",
                  "type": "_id_20"
                },
                {
                  "name": "calendar",
                  "type": "_id_19"
                },
                {
                  "name": "calendar$_identifier"
                },
                {
                  "name": "ready",
                  "type": "_id_28"
                },
                {
                  "name": "socialName",
                  "type": "_id_10"
                },
                {
                  "name": "currency",
                  "type": "_id_19"
                },
                {
                  "name": "currency$_identifier"
                },
                {
                  "name": "generalLedger",
                  "type": "_id_19"
                },
                {
                  "name": "generalLedger$_identifier"
                },
                {
                  "name": "aPRMGlitem",
                  "type": "_id_1A6C5E0A5868417786ECCF3C02B17D65"
                },
                {
                  "name": "aPRMGlitem$_identifier"
                },
                {
                  "name": "periodControlAllowedOrganization",
                  "type": "_id_100A788331734AE8BCC87BA0AC9E3406"
                },
                {
                  "name": "periodControlAllowedOrganization$_identifier"
                },
                {
                  "name": "calendarOwnerOrganization",
                  "type": "_id_100A788331734AE8BCC87BA0AC9E3406"
                },
                {
                  "name": "calendarOwnerOrganization$_identifier"
                },
                {
                  "name": "legalEntityOrganization",
                  "type": "_id_100A788331734AE8BCC87BA0AC9E3406"
                },
                {
                  "name": "legalEntityOrganization$_identifier"
                },
                {
                  "name": "inheritedCalendar",
                  "type": "_id_82C7F2AD834B493083D5DDAE50A01D0D"
                },
                {
                  "name": "inheritedCalendar$_identifier"
                },
                {
                  "name": "businessUnitOrganization",
                  "type": "_id_100A788331734AE8BCC87BA0AC9E3406"
                },
                {
                  "name": "businessUnitOrganization$_identifier"
                },
                {
                  "name": "extbpEnabled",
                  "type": "_id_20"
                },
                {
                  "name": "extbpConfig",
                  "type": "_id_49D83FCC4AF746BBB09D10DFCC61E0DF"
                },
                {
                  "name": "extbpConfig$_identifier"
                }
              ],
              "requestProperties": {
                "params": {
                  "columnName": "ad_org_id",
                  "Constants_FIELDSEPARATOR": "$",
                  "Constants_IDENTIFIER": "_identifier",
                  "IsSelectorItem": "true"
                }
              }
            },
            "defaultPopupFilterField": "_identifier",
            "displayField": "_identifier",
            "extraSearchFields": [],
            "name": "ad_org_id",
            "onChangeFunction": "OB.APRM.AddPayment.organizationOnChange",
            "outFields": {},
            "outHiddenInputPrefix": "inpadOrgId",
            "paramId": "94DAEE7477AF40ED9B40E3A546EACD02",
            "pickListFields": [
              {
                "name": "_identifier",
                "title": " ",
                "type": "text"
              }
            ],
            "popupTextMatchStyle": "substring",
            "required": true,
            "selectorDefinitionId": "14F59CBE3B804B8D81D29DFFF5B51467",
            "selectorGridFields": [],
            "showSelectorGrid": false,
            "targetEntity": "Organization",
            "textMatchStyle": "startsWith",
            "title": "Organization",
            "type": "_id_E867C99480754094BE0705D9877FF833",
            "valueField": "id",
            "width": "*"
          },
          {
            "name": "bslamount",
            "paramId": "2AC4B53D136E4167B673265DAF6660DA",
            "required": false,
            "title": "Bank Statement Line Amount",
            "type": "_id_12",
            "width": "*"
          },
          {
            "name": "payment_documentno",
            "paramId": "F2C546F2C45C4AB58494B2D384E6A8E8",
            "required": true,
            "startRow": true,
            "title": "Payment Document No.",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "reference_no",
            "paramId": "80465B6CEEB84046955FD51F38FC2804",
            "required": false,
            "title": "Reference No.",
            "type": "_id_10",
            "width": "*"
          },
          {
            "datasource": {
              "createClassName": "",
              "dataURL": "/etendo/org.openbravo.service.datasource/Currency",
              "fields": [
                {
                  "name": "id",
                  "primaryKey": true,
                  "type": "_id_13"
                },
                {
                  "name": "client",
                  "type": "_id_19"
                },
                {
                  "name": "client$_identifier"
                },
                {
                  "name": "organization",
                  "type": "_id_19"
                },
                {
                  "name": "organization$_identifier"
                },
                {
                  "name": "active",
                  "type": "_id_20"
                },
                {
                  "name": "creationDate",
                  "type": "_id_16"
                },
                {
                  "name": "createdBy",
                  "type": "_id_30"
                },
                {
                  "name": "createdBy$_identifier"
                },
                {
                  "name": "updated",
                  "type": "_id_16"
                },
                {
                  "name": "updatedBy",
                  "type": "_id_30"
                },
                {
                  "name": "updatedBy$_identifier"
                },
                {
                  "name": "iSOCode",
                  "type": "_id_10"
                },
                {
                  "name": "symbol",
                  "type": "_id_10"
                },
                {
                  "name": "description",
                  "type": "_id_10"
                },
                {
                  "name": "standardPrecision",
                  "type": "_id_11"
                },
                {
                  "name": "costingPrecision",
                  "type": "_id_11"
                },
                {
                  "name": "pricePrecision",
                  "type": "_id_11"
                },
                {
                  "name": "currencySymbolAtTheRight",
                  "type": "_id_20"
                }
              ],
              "requestProperties": {
                "params": {
                  "columnName": "c_currency_id",
                  "Constants_FIELDSEPARATOR": "$",
                  "Constants_IDENTIFIER": "_identifier",
                  "IsSelectorItem": "true"
                }
              }
            },
            "defaultPopupFilterField": "_identifier",
            "displayField": "_identifier",
            "extraSearchFields": [],
            "name": "c_currency_id",
            "onChangeFunction": "OB.APRM.AddPayment.currencyOnChange",
            "outFields": {},
            "outHiddenInputPrefix": "inpcCurrencyId",
            "paramId": "EA236C2D265845E6A3E2AE5A5A7A7AB2",
            "pickListFields": [
              {
                "name": "_identifier",
                "title": " ",
                "type": "text"
              }
            ],
            "popupTextMatchStyle": "substring",
            "required": true,
            "selectorDefinitionId": "4C399E0BD7C34BAFA55FEAACA0568B31",
            "selectorGridFields": [],
            "showSelectorGrid": false,
            "targetEntity": "Currency",
            "textMatchStyle": "startsWith",
            "title": "Currency",
            "type": "_id_E384FFD20B664C7894E94B05B1D8EE27",
            "valueField": "id",
            "width": "*"
          },
          {
            "datasource": {
              "createClassName": "",
              "dataURL": "/etendo/org.openbravo.service.datasource/Currency",
              "fields": [
                {
                  "name": "id",
                  "primaryKey": true,
                  "type": "_id_13"
                },
                {
                  "name": "client",
                  "type": "_id_19"
                },
                {
                  "name": "client$_identifier"
                },
                {
                  "name": "organization",
                  "type": "_id_19"
                },
                {
                  "name": "organization$_identifier"
                },
                {
                  "name": "active",
                  "type": "_id_20"
                },
                {
                  "name": "creationDate",
                  "type": "_id_16"
                },
                {
                  "name": "createdBy",
                  "type": "_id_30"
                },
                {
                  "name": "createdBy$_identifier"
                },
                {
                  "name": "updated",
                  "type": "_id_16"
                },
                {
                  "name": "updatedBy",
                  "type": "_id_30"
                },
                {
                  "name": "updatedBy$_identifier"
                },
                {
                  "name": "iSOCode",
                  "type": "_id_10"
                },
                {
                  "name": "symbol",
                  "type": "_id_10"
                },
                {
                  "name": "description",
                  "type": "_id_10"
                },
                {
                  "name": "standardPrecision",
                  "type": "_id_11"
                },
                {
                  "name": "costingPrecision",
                  "type": "_id_11"
                },
                {
                  "name": "pricePrecision",
                  "type": "_id_11"
                },
                {
                  "name": "currencySymbolAtTheRight",
                  "type": "_id_20"
                }
              ],
              "requestProperties": {
                "params": {
                  "columnName": "c_currency_to_id",
                  "Constants_FIELDSEPARATOR": "$",
                  "Constants_IDENTIFIER": "_identifier",
                  "IsSelectorItem": "true"
                }
              }
            },
            "defaultPopupFilterField": "_identifier",
            "displayField": "_identifier",
            "extraSearchFields": [],
            "name": "c_currency_to_id",
            "outFields": {},
            "outHiddenInputPrefix": "inpcCurrencyToId",
            "paramId": "4C09892656344AB1ACF988D57D84B96B",
            "pickListFields": [
              {
                "name": "_identifier",
                "title": " ",
                "type": "text"
              }
            ],
            "popupTextMatchStyle": "substring",
            "required": false,
            "selectorDefinitionId": "4C399E0BD7C34BAFA55FEAACA0568B31",
            "selectorGridFields": [],
            "showSelectorGrid": false,
            "targetEntity": "Currency",
            "textMatchStyle": "startsWith",
            "title": "Currency To",
            "type": "_id_E384FFD20B664C7894E94B05B1D8EE27",
            "valueField": "id",
            "width": "*"
          },
          {
            "datasource": {
              "createClassName": "",
              "dataURL": "/etendo/org.openbravo.service.datasource/BusinessPartner",
              "fields": [
                {
                  "name": "id",
                  "primaryKey": true,
                  "type": "_id_13"
                },
                {
                  "name": "client",
                  "type": "_id_19"
                },
                {
                  "name": "client$_identifier"
                },
                {
                  "name": "organization",
                  "type": "_id_19"
                },
                {
                  "name": "organization$_identifier"
                },
                {
                  "name": "active",
                  "type": "_id_20"
                },
                {
                  "name": "creationDate",
                  "type": "_id_16"
                },
                {
                  "name": "createdBy",
                  "type": "_id_30"
                },
                {
                  "name": "createdBy$_identifier"
                },
                {
                  "name": "updated",
                  "type": "_id_16"
                },
                {
                  "name": "updatedBy",
                  "type": "_id_30"
                },
                {
                  "name": "updatedBy$_identifier"
                },
                {
                  "name": "searchKey",
                  "type": "_id_10"
                },
                {
                  "name": "name",
                  "type": "_id_10"
                },
                {
                  "name": "name2",
                  "type": "_id_10"
                },
                {
                  "name": "description",
                  "type": "_id_10"
                },
                {
                  "name": "summaryLevel",
                  "type": "_id_20"
                },
                {
                  "name": "businessPartnerCategory",
                  "type": "_id_19"
                },
                {
                  "name": "businessPartnerCategory$_identifier"
                },
                {
                  "name": "oneTimeTransaction",
                  "type": "_id_20"
                },
                {
                  "name": "potentialCustomer",
                  "type": "_id_20"
                },
                {
                  "name": "vendor",
                  "type": "_id_20"
                },
                {
                  "name": "customer",
                  "type": "_id_20"
                },
                {
                  "name": "employee",
                  "type": "_id_20"
                },
                {
                  "name": "isSalesRepresentative",
                  "type": "_id_20"
                },
                {
                  "name": "referenceNo",
                  "type": "_id_10"
                },
                {
                  "name": "dUNS",
                  "type": "_id_10"
                },
                {
                  "name": "uRL",
                  "type": "_id_800101"
                },
                {
                  "name": "language",
                  "type": "_id_106"
                },
                {
                  "name": "language$_identifier"
                },
                {
                  "name": "taxID",
                  "type": "_id_10"
                },
                {
                  "name": "taxExempt",
                  "type": "_id_20"
                },
                {
                  "name": "invoiceSchedule",
                  "type": "_id_19"
                },
                {
                  "name": "invoiceSchedule$_identifier"
                },
                {
                  "name": "valuation",
                  "type": "_id_10"
                },
                {
                  "name": "volumeOfSales",
                  "type": "_id_12"
                },
                {
                  "name": "noOfEmployees",
                  "type": "_id_11"
                },
                {
                  "name": "nAICSSIC",
                  "type": "_id_10"
                },
                {
                  "name": "dateOfFirstSale",
                  "type": "_id_15"
                },
                {
                  "name": "acquisitionCost",
                  "type": "_id_12"
                },
                {
                  "name": "expectedLifetimeRevenue",
                  "type": "_id_12"
                },
                {
                  "name": "lifetimeRevenueToDate",
                  "type": "_id_12"
                },
                {
                  "name": "share",
                  "type": "_id_11"
                },
                {
                  "name": "formOfPayment",
                  "type": "_id_195",
                  "valueMap": {
                    "1": "Wire Transfer",
                    "2": "Check",
                    "3": "Promissory Note",
                    "4": "Money Order",
                    "5": "Bank Deposit",
                    "B": "Cash",
                    "C": "Cash on Delivery",
                    "K": "Credit Card",
                    "P": "On Credit",
                    "R": "Bank Remittance",
                    "W": "Withholding"
                  }
                },
                {
                  "name": "creditLimit",
                  "type": "_id_12"
                },
                {
                  "name": "creditUsed",
                  "type": "_id_12"
                },
                {
                  "name": "paymentTerms",
                  "type": "_id_19"
                },
                {
                  "name": "paymentTerms$_identifier"
                },
                {
                  "name": "priceList",
                  "type": "_id_166"
                },
                {
                  "name": "priceList$_identifier"
                },
                {
                  "name": "printDiscount",
                  "type": "_id_20"
                },
                {
                  "name": "orderDescription",
                  "type": "_id_10"
                },
                {
                  "name": "orderReference",
                  "type": "_id_10"
                },
                {
                  "name": "pOFormOfPayment",
                  "type": "_id_195",
                  "valueMap": {
                    "1": "Wire Transfer",
                    "2": "Check",
                    "3": "Promissory Note",
                    "4": "Money Order",
                    "5": "Bank Deposit",
                    "B": "Cash",
                    "C": "Cash on Delivery",
                    "K": "Credit Card",
                    "P": "On Credit",
                    "R": "Bank Remittance",
                    "W": "Withholding"
                  }
                },
                {
                  "name": "purchasePricelist",
                  "type": "_id_800031"
                },
                {
                  "name": "purchasePricelist$_identifier"
                },
                {
                  "name": "pOPaymentTerms",
                  "type": "_id_227"
                },
                {
                  "name": "pOPaymentTerms$_identifier"
                },
                {
                  "name": "numberOfCopies",
                  "type": "_id_11"
                },
                {
                  "name": "greeting",
                  "type": "_id_19"
                },
                {
                  "name": "greeting$_identifier"
                },
                {
                  "name": "invoiceTerms",
                  "type": "_id_150",
                  "valueMap": {
                    "D": "After Delivery",
                    "I": "Immediate",
                    "N": "Do Not Invoice",
                    "O": "After Order Delivered",
                    "S": "Customer Schedule After Delivery"
                  }
                },
                {
                  "name": "deliveryTerms",
                  "type": "_id_151",
                  "valueMap": {
                    "A": "Availability",
                    "L": "Complete Line",
                    "O": "Complete Order",
                    "R": "After Receipt"
                  }
                },
                {
                  "name": "deliveryMethod",
                  "type": "_id_152",
                  "valueMap": {
                    "D": "Delivery",
                    "P": "Pickup",
                    "S": "Shipper"
                  }
                },
                {
                  "name": "salesRepresentative",
                  "type": "_id_187"
                },
                {
                  "name": "salesRepresentative$_identifier"
                },
                {
                  "name": "partnerParent",
                  "type": "_id_13"
                },
                {
                  "name": "creditStatus",
                  "type": "_id_289",
                  "valueMap": {
                    "H": "Credit Hold",
                    "O": "Credit OK",
                    "S": "Credit Stop",
                    "W": "Credit Watch",
                    "X": "No Credit Check"
                  }
                },
                {
                  "name": "forcedOrg",
                  "type": "_id_276"
                },
                {
                  "name": "forcedOrg$_identifier"
                },
                {
                  "name": "pricesShownInOrder",
                  "type": "_id_20"
                },
                {
                  "name": "invoiceGrouping",
                  "type": "_id_800026",
                  "valueMap": {
                    "000000000000000": "By customer",
                    "000000000010000": "By project",
                    "000010000000000": "By ship location"
                  }
                },
                {
                  "name": "maturityDate1",
                  "type": "_id_11"
                },
                {
                  "name": "maturityDate2",
                  "type": "_id_11"
                },
                {
                  "name": "maturityDate3",
                  "type": "_id_11"
                },
                {
                  "name": "operator",
                  "type": "_id_20"
                },
                {
                  "name": "uPCEAN",
                  "type": "_id_10"
                },
                {
                  "name": "salaryCategory",
                  "type": "_id_19"
                },
                {
                  "name": "salaryCategory$_identifier"
                },
                {
                  "name": "invoicePrintformat",
                  "type": "_id_800007",
                  "valueMap": {
                    "1": "Detail",
                    "2": "Total",
                    "3": "Product detail"
                  }
                },
                {
                  "name": "consumptionDays",
                  "type": "_id_11"
                },
                {
                  "name": "bankAccount",
                  "type": "_id_800046"
                },
                {
                  "name": "bankAccount$_identifier"
                },
                {
                  "name": "taxCategory",
                  "type": "_id_800090"
                },
                {
                  "name": "taxCategory$_identifier"
                },
                {
                  "name": "pOMaturityDate1",
                  "type": "_id_11"
                },
                {
                  "name": "pOMaturityDate2",
                  "type": "_id_11"
                },
                {
                  "name": "pOMaturityDate3",
                  "type": "_id_11"
                },
                {
                  "name": "transactionalBankAccount",
                  "type": "_id_800046"
                },
                {
                  "name": "transactionalBankAccount$_identifier"
                },
                {
                  "name": "sOBPTaxCategory",
                  "type": "_id_800090"
                },
                {
                  "name": "sOBPTaxCategory$_identifier"
                },
                {
                  "name": "fiscalcode",
                  "type": "_id_10"
                },
                {
                  "name": "isofiscalcode",
                  "type": "_id_10"
                },
                {
                  "name": "incotermsPO",
                  "type": "_id_D2D4CC1F12434BB69733166A9423F2C6"
                },
                {
                  "name": "incotermsPO$_identifier"
                },
                {
                  "name": "incotermsSO",
                  "type": "_id_D2D4CC1F12434BB69733166A9423F2C6"
                },
                {
                  "name": "incotermsSO$_identifier"
                },
                {
                  "name": "paymentMethod",
                  "type": "_id_EED0EF97D4A7421687F3B365D009E7A6"
                },
                {
                  "name": "paymentMethod$_identifier"
                },
                {
                  "name": "pOPaymentMethod",
                  "type": "_id_EED0EF97D4A7421687F3B365D009E7A6"
                },
                {
                  "name": "pOPaymentMethod$_identifier"
                },
                {
                  "name": "account",
                  "type": "_id_DF1CEA94B3564A33AFDB37C07E1CE353"
                },
                {
                  "name": "account$_identifier"
                },
                {
                  "name": "pOFinancialAccount",
                  "type": "_id_DF1CEA94B3564A33AFDB37C07E1CE353"
                },
                {
                  "name": "pOFinancialAccount$_identifier"
                },
                {
                  "name": "customerBlocking",
                  "type": "_id_20"
                },
                {
                  "name": "vendorBlocking",
                  "type": "_id_20"
                },
                {
                  "name": "paymentIn",
                  "type": "_id_20"
                },
                {
                  "name": "paymentOut",
                  "type": "_id_20"
                },
                {
                  "name": "salesInvoice",
                  "type": "_id_20"
                },
                {
                  "name": "purchaseInvoice",
                  "type": "_id_20"
                },
                {
                  "name": "salesOrder",
                  "type": "_id_20"
                },
                {
                  "name": "purchaseOrder",
                  "type": "_id_20"
                },
                {
                  "name": "goodsShipment",
                  "type": "_id_20"
                },
                {
                  "name": "goodsReceipt",
                  "type": "_id_20"
                },
                {
                  "name": "cashVAT",
                  "type": "_id_20"
                },
                {
                  "name": "setNewCurrency",
                  "type": "_id_28"
                },
                {
                  "name": "currency",
                  "type": "_id_112"
                },
                {
                  "name": "currency$_identifier"
                },
                {
                  "name": "birthPlace",
                  "type": "_id_10"
                },
                {
                  "name": "birthDay",
                  "type": "_id_15"
                },
                {
                  "name": "isCustomerConsent",
                  "type": "_id_20"
                },
                {
                  "additional": true,
                  "name": "searchKey",
                  "type": "_id_10"
                },
                {
                  "additional": true,
                  "name": "businessPartnerCategory$name",
                  "type": "_id_10"
                },
                {
                  "additional": true,
                  "name": "vendor",
                  "type": "_id_20"
                },
                {
                  "additional": true,
                  "name": "name",
                  "type": "_id_10"
                },
                {
                  "additional": true,
                  "name": "customer",
                  "type": "_id_20"
                }
              ],
              "requestProperties": {
                "params": {
                  "_extraProperties": "searchKey,businessPartnerCategory$name,vendor,name,customer",
                  "columnName": "received_from",
                  "Constants_FIELDSEPARATOR": "$",
                  "Constants_IDENTIFIER": "_identifier",
                  "IsSelectorItem": "true"
                }
              }
            },
            "defaultPopupFilterField": "name",
            "displayField": "_identifier",
            "extraSearchFields": [
              "searchKey",
              "businessPartnerCategory$name",
              "name"
            ],
            "name": "received_from",
            "onChangeFunction": "OB.APRM.AddPayment.receivedFromOnChange",
            "outFields": {},
            "outHiddenInputPrefix": "inpreceivedFrom",
            "paramId": "EB46162236C04DC2812C7095A88FA708",
            "pickListFields": [
              {
                "name": "_identifier",
                "title": " ",
                "type": "text"
              }
            ],
            "popupTextMatchStyle": "substring",
            "required": false,
            "selectorDefinitionId": "A98899B1C75A4F4EBD3414F1B654EFAB",
            "selectorGridFields": [
              {
                "name": "name",
                "showHover": true,
                "title": "Commercial Name",
                "type": "_id_10"
              },
              {
                "name": "searchKey",
                "showHover": true,
                "title": "Search Key",
                "type": "_id_10"
              },
              {
                "name": "businessPartnerCategory$name",
                "showHover": true,
                "title": "Business Partner Category",
                "type": "_id_10"
              },
              {
                "name": "customer",
                "showHover": true,
                "title": "Customer",
                "type": "_id_20"
              },
              {
                "name": "vendor",
                "showHover": true,
                "title": "Vendor",
                "type": "_id_20"
              }
            ],
            "showSelectorGrid": true,
            "targetEntity": "BusinessPartner",
            "textMatchStyle": "substring",
            "title": "Received From",
            "type": "_id_56DEFF37A33F46D1AC918C97C4447EAF",
            "valueField": "id",
            "width": "*"
          },
          {
            "datasource": {
              "createClassName": "",
              "dataURL": "/etendo/org.openbravo.service.datasource/FIN_PaymentMethod",
              "fields": [
                {
                  "name": "id",
                  "primaryKey": true,
                  "type": "_id_13"
                },
                {
                  "name": "client",
                  "type": "_id_19"
                },
                {
                  "name": "client$_identifier"
                },
                {
                  "name": "organization",
                  "type": "_id_19"
                },
                {
                  "name": "organization$_identifier"
                },
                {
                  "name": "creationDate",
                  "type": "_id_16"
                },
                {
                  "name": "createdBy",
                  "type": "_id_30"
                },
                {
                  "name": "createdBy$_identifier"
                },
                {
                  "name": "updated",
                  "type": "_id_16"
                },
                {
                  "name": "updatedBy",
                  "type": "_id_30"
                },
                {
                  "name": "updatedBy$_identifier"
                },
                {
                  "name": "active",
                  "type": "_id_20"
                },
                {
                  "name": "name",
                  "type": "_id_10"
                },
                {
                  "name": "description",
                  "type": "_id_14"
                },
                {
                  "name": "automaticReceipt",
                  "type": "_id_20"
                },
                {
                  "name": "automaticPayment",
                  "type": "_id_20"
                },
                {
                  "name": "automaticDeposit",
                  "type": "_id_20"
                },
                {
                  "name": "automaticWithdrawn",
                  "type": "_id_20"
                },
                {
                  "name": "payinAllow",
                  "type": "_id_20"
                },
                {
                  "name": "payoutAllow",
                  "type": "_id_20"
                },
                {
                  "name": "payinExecutionType",
                  "type": "_id_FC98D43996374909B1AAC0197BBE95BA",
                  "valueMap": {
                    "A": "Automatic",
                    "M": "Manual"
                  }
                },
                {
                  "name": "payoutExecutionType",
                  "type": "_id_FC98D43996374909B1AAC0197BBE95BA",
                  "valueMap": {
                    "A": "Automatic",
                    "M": "Manual"
                  }
                },
                {
                  "name": "payinExecutionProcess",
                  "type": "_id_B7E66794F4BA46C3ADB2CBD013252AA6"
                },
                {
                  "name": "payinExecutionProcess$_identifier"
                },
                {
                  "name": "payoutExecutionProcess",
                  "type": "_id_B7E66794F4BA46C3ADB2CBD013252AA6"
                },
                {
                  "name": "payoutExecutionProcess$_identifier"
                },
                {
                  "name": "payinDeferred",
                  "type": "_id_20"
                },
                {
                  "name": "payoutDeferred",
                  "type": "_id_20"
                },
                {
                  "name": "uponReceiptUse",
                  "type": "_id_085E99751D2045AA9D4FA23F4B765B21",
                  "valueMap": {
                    "CLE": "Cleared Payment Account",
                    "DEP": "Deposited Payment Account",
                    "INT": "In Transit Payment Account",
                    "WIT": "Withdrawn Payment Account"
                  }
                },
                {
                  "name": "uponDepositUse",
                  "type": "_id_085E99751D2045AA9D4FA23F4B765B21",
                  "valueMap": {
                    "CLE": "Cleared Payment Account",
                    "DEP": "Deposited Payment Account",
                    "INT": "In Transit Payment Account",
                    "WIT": "Withdrawn Payment Account"
                  }
                },
                {
                  "name": "iNUponClearingUse",
                  "type": "_id_085E99751D2045AA9D4FA23F4B765B21",
                  "valueMap": {
                    "CLE": "Cleared Payment Account",
                    "DEP": "Deposited Payment Account",
                    "INT": "In Transit Payment Account",
                    "WIT": "Withdrawn Payment Account"
                  }
                },
                {
                  "name": "uponPaymentUse",
                  "type": "_id_085E99751D2045AA9D4FA23F4B765B21",
                  "valueMap": {
                    "CLE": "Cleared Payment Account",
                    "DEP": "Deposited Payment Account",
                    "INT": "In Transit Payment Account",
                    "WIT": "Withdrawn Payment Account"
                  }
                },
                {
                  "name": "uponWithdrawalUse",
                  "type": "_id_085E99751D2045AA9D4FA23F4B765B21",
                  "valueMap": {
                    "CLE": "Cleared Payment Account",
                    "DEP": "Deposited Payment Account",
                    "INT": "In Transit Payment Account",
                    "WIT": "Withdrawn Payment Account"
                  }
                },
                {
                  "name": "oUTUponClearingUse",
                  "type": "_id_085E99751D2045AA9D4FA23F4B765B21",
                  "valueMap": {
                    "CLE": "Cleared Payment Account",
                    "DEP": "Deposited Payment Account",
                    "INT": "In Transit Payment Account",
                    "WIT": "Withdrawn Payment Account"
                  }
                },
                {
                  "name": "payinIsMulticurrency",
                  "type": "_id_20"
                },
                {
                  "name": "payoutIsMulticurrency",
                  "type": "_id_20"
                }
              ],
              "requestProperties": {
                "params": {
                  "columnName": "fin_paymentmethod_id",
                  "Constants_FIELDSEPARATOR": "$",
                  "Constants_IDENTIFIER": "_identifier",
                  "IsSelectorItem": "true"
                }
              }
            },
            "defaultPopupFilterField": "_identifier",
            "displayField": "_identifier",
            "extraSearchFields": [],
            "name": "fin_paymentmethod_id",
            "onChangeFunction": "OB.APRM.AddPayment.paymentMethodOnChange",
            "outFields": {},
            "outHiddenInputPrefix": "inpfinPaymentmethodId",
            "paramId": "838EF92641044D038600E4C1B6F1C4CB",
            "pickListFields": [
              {
                "name": "_identifier",
                "title": " ",
                "type": "text"
              }
            ],
            "popupTextMatchStyle": "substring",
            "required": true,
            "selectorDefinitionId": "BA4FDCB15ACB47AD81BE3985E13032EE",
            "selectorGridFields": [],
            "showSelectorGrid": false,
            "targetEntity": "FIN_PaymentMethod",
            "textMatchStyle": "substring",
            "title": "Payment Method",
            "type": "_id_E664E415582A483DBBC91DEF256FB9E6",
            "valueField": "id",
            "width": "*"
          },
          {
            "name": "actual_payment",
            "onChangeFunction": "OB.APRM.AddPayment.actualPaymentOnChange",
            "paramId": "A95732C0B3794D79B2E945D50872D931",
            "required": true,
            "title": "Actual Payment",
            "type": "_id_12",
            "width": "*"
          },
          {
            "name": "converted_amount",
            "onChangeFunction": "OB.APRM.AddPayment.convertedAmountOnChange",
            "paramId": "0E081905DD9646A2AFB296F81C1AA62E",
            "required": true,
            "title": "Converted Amount",
            "type": "_id_12",
            "width": "*"
          },
          {
            "name": "payment_date",
            "onChangeFunction": "OB.APRM.AddPayment.paymentDateOnChange",
            "paramId": "E2FB4840B65A44D4B3090A7E3C95FD95",
            "required": true,
            "title": "Payment Date",
            "type": "_id_15",
            "width": "50%"
          },
          {
            "datasource": {
              "createClassName": "",
              "dataURL": "/etendo/org.openbravo.service.datasource/FIN_Financial_Account",
              "fields": [
                {
                  "name": "id",
                  "primaryKey": true,
                  "type": "_id_13"
                },
                {
                  "name": "client",
                  "type": "_id_19"
                },
                {
                  "name": "client$_identifier"
                },
                {
                  "name": "organization",
                  "type": "_id_19"
                },
                {
                  "name": "organization$_identifier"
                },
                {
                  "name": "creationDate",
                  "type": "_id_16"
                },
                {
                  "name": "createdBy",
                  "type": "_id_30"
                },
                {
                  "name": "createdBy$_identifier"
                },
                {
                  "name": "updated",
                  "type": "_id_16"
                },
                {
                  "name": "updatedBy",
                  "type": "_id_30"
                },
                {
                  "name": "updatedBy$_identifier"
                },
                {
                  "name": "active",
                  "type": "_id_20"
                },
                {
                  "name": "currency",
                  "type": "_id_19"
                },
                {
                  "name": "currency$_identifier"
                },
                {
                  "name": "name",
                  "type": "_id_10"
                },
                {
                  "name": "description",
                  "type": "_id_14"
                },
                {
                  "name": "type",
                  "type": "_id_A6BDFA712FF948CE903C4C463E832FC1",
                  "valueMap": {
                    "B": "Bank",
                    "C": "Cash"
                  }
                },
                {
                  "name": "businessPartner",
                  "type": "_id_488E4BF765294DD8A7A943BDED4BA6E6"
                },
                {
                  "name": "businessPartner$_identifier"
                },
                {
                  "name": "locationAddress",
                  "type": "_id_21"
                },
                {
                  "name": "locationAddress$_identifier"
                },
                {
                  "name": "routingNo",
                  "type": "_id_10"
                },
                {
                  "name": "swiftCode",
                  "type": "_id_10"
                },
                {
                  "name": "bankCode",
                  "type": "_id_10"
                },
                {
                  "name": "branchCode",
                  "type": "_id_10"
                },
                {
                  "name": "bankDigitcontrol",
                  "type": "_id_10"
                },
                {
                  "name": "iNENo",
                  "type": "_id_10"
                },
                {
                  "name": "accountDigitcontrol",
                  "type": "_id_10"
                },
                {
                  "name": "partialAccountNo",
                  "type": "_id_10"
                },
                {
                  "name": "accountNo",
                  "type": "_id_10"
                },
                {
                  "name": "currentBalance",
                  "type": "_id_12"
                },
                {
                  "name": "initialBalance",
                  "type": "_id_12"
                },
                {
                  "name": "creditLimit",
                  "type": "_id_22"
                },
                {
                  "name": "iBAN",
                  "type": "_id_10"
                },
                {
                  "name": "default",
                  "type": "_id_20"
                },
                {
                  "name": "matchingAlgorithm",
                  "type": "_id_19"
                },
                {
                  "name": "matchingAlgorithm$_identifier"
                },
                {
                  "name": "typewriteoff",
                  "type": "_id_C3531F85C14B4515AB7259F0D338050D",
                  "valueMap": {
                    "A": "Amount"
                  }
                },
                {
                  "name": "writeofflimit",
                  "type": "_id_12"
                },
                {
                  "name": "genericAccountNo",
                  "type": "_id_10"
                },
                {
                  "name": "country",
                  "type": "_id_19"
                },
                {
                  "name": "country$_identifier"
                },
                {
                  "name": "bankFormat",
                  "type": "_id_C123B7BF5B2C438D84D2E509734776B5",
                  "valueMap": {
                    "GENERIC": "Use Generic Account No.",
                    "IBAN": "Use IBAN",
                    "SPANISH": "Use Spanish",
                    "SWIFT": "Use SWIFT + Generic Account No."
                  }
                },
                {
                  "name": "aPRMImportBankFile",
                  "type": "_id_28"
                },
                {
                  "name": "aPRMMatchTransactions",
                  "type": "_id_28"
                },
                {
                  "name": "aPRMReconcile",
                  "type": "_id_28"
                },
                {
                  "name": "aPRMMatchTransactionsForce",
                  "type": "_id_28"
                },
                {
                  "name": "aprmAddtransactionpd",
                  "type": "_id_28"
                },
                {
                  "name": "aprmFindtransactionspd",
                  "type": "_id_28"
                },
                {
                  "name": "aprmAddMultiplePayments",
                  "type": "_id_28"
                },
                {
                  "name": "aprmFundsTrans",
                  "type": "_id_28"
                },
                {
                  "name": "aprmIsfundstransEnabled",
                  "type": "_id_20"
                },
                {
                  "name": "aprmGlitemDiff",
                  "type": "_id_1A6C5E0A5868417786ECCF3C02B17D65"
                },
                {
                  "name": "aprmGlitemDiff$_identifier"
                },
                {
                  "name": "lastreconbalance",
                  "type": "_id_12"
                },
                {
                  "name": "lastreconciliation",
                  "type": "_id_15"
                }
              ],
              "requestProperties": {
                "params": {
                  "columnName": "fin_financial_account_id",
                  "Constants_FIELDSEPARATOR": "$",
                  "Constants_IDENTIFIER": "_identifier",
                  "IsSelectorItem": "true"
                }
              }
            },
            "defaultPopupFilterField": "_identifier",
            "displayField": "_identifier",
            "extraSearchFields": [],
            "name": "fin_financial_account_id",
            "onChangeFunction": "OB.APRM.AddPayment.financialAccountOnChange",
            "outFields": {},
            "outHiddenInputPrefix": "inpfinFinancialAccountId",
            "paramId": "1D16F7BDCDD04F3A9AD259E84811AA41",
            "pickListFields": [
              {
                "name": "_identifier",
                "title": " ",
                "type": "text"
              }
            ],
            "popupTextMatchStyle": "substring",
            "required": true,
            "selectorDefinitionId": "5D29D4DFCF4440B8BF89420419A0DBFE",
            "selectorGridFields": [],
            "showSelectorGrid": false,
            "targetEntity": "FIN_Financial_Account",
            "textMatchStyle": "startsWith",
            "title": "Deposit To",
            "type": "_id_7F1A079A842545DF966D7EFD4BC5CFCE",
            "valueField": "id",
            "width": "*"
          },
          {
            "name": "expected_payment",
            "paramId": "7F740AFA59DB483FB1BBDD79E066C543",
            "required": false,
            "title": "Expected Payment",
            "type": "_id_12",
            "width": "*"
          },
          {
            "name": "conversion_rate",
            "onChangeFunction": "OB.APRM.AddPayment.conversionRateOnChange",
            "paramId": "200C902859B746D5BDDC773D0C91C1BB",
            "required": true,
            "title": "Conversion Rate",
            "type": "_id_800019",
            "width": "*"
          },
          {
            "defaultValue": "Order/Invoice",
            "itemIds": ["transaction_type", "order_invoice"],
            "name": "0C672A3B7CDF416F9522DF3FA5AE4022",
            "sectionExpanded": true,
            "title": "Order/Invoice",
            "type": "OBSectionItem"
          },
          {
            "name": "transaction_type",
            "onChangeFunction": "OB.APRM.AddPayment.transactionTypeOnChangeFunction",
            "paramId": "FB975E5F2AE3405197173B0DFB172ECC",
            "required": true,
            "title": "Transaction Type",
            "type": "_id_1543EE40981840C3929CBC16320FE155",
            "valueMap": {
              "B": "Orders and Invoices",
              "I": "Invoices",
              "O": "Orders"
            },
            "width": "*"
          },
          {
            "displayedRowsNumber": 10,
            "name": "order_invoice",
            "onGridLoadFunction": "OB.APRM.AddPayment.orderInvoiceOnLoadGrid",
            "paramId": "12F5A54CF6FA4702B147CC08BC664051",
            "required": false,
            "showTitle": false,
            "title": "Order/Invoice",
            "type": "OBPickEditGridItem",
            "viewProperties": {
              "dataSourceProperties": {
                "createClassName": "OBPickAndExecuteDataSource",
                "dataURL": "/etendo/org.openbravo.service.datasource/3C1148C0AB604DE1B51B7EA4112C325F",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "salesOrderNo",
                    "type": "_id_10"
                  },
                  {
                    "name": "invoiceNo",
                    "type": "_id_10"
                  },
                  {
                    "name": "paymentMethod",
                    "type": "_id_10"
                  },
                  {
                    "name": "paymentMethodName",
                    "type": "_id_10"
                  },
                  {
                    "name": "businessPartner",
                    "type": "_id_10"
                  },
                  {
                    "name": "businessPartnerName",
                    "type": "_id_10"
                  },
                  {
                    "name": "expectedDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "expectedAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "invoicedAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "outstandingAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "amount",
                    "type": "_id_12"
                  },
                  {
                    "name": "writeoff",
                    "type": "_id_20"
                  },
                  {
                    "name": "obSelected",
                    "type": "_id_20"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_10"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_10"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_className": "OBPickAndExecuteDataSource",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier",
                    "tableId": "58AF4D3E594B421A9A7307480736F03E"
                  }
                }
              },
              "entity": "aprm_orderinvoice",
              "fields": [
                {
                  "columnName": "salesOrderNo",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 60,
                    "length": 60,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 1
                  },
                  "id": "09C582CB650B44C7858C1EDC272F77AE",
                  "inpColumnName": "inpsalesorderno",
                  "length": 60,
                  "name": "salesOrderNo",
                  "title": "Order No.",
                  "type": "_id_10"
                },
                {
                  "columnName": "invoiceNo",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 60,
                    "length": 60,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 2
                  },
                  "id": "5826408A05044E458F0DCFDB9696C82C",
                  "inpColumnName": "inpinvoiceno",
                  "length": 60,
                  "name": "invoiceNo",
                  "title": "Invoice No.",
                  "type": "_id_10"
                },
                {
                  "columnName": "paymentMethodName",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 60,
                    "length": 60,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 3
                  },
                  "id": "4C4DA8A450BA4A3E8A939800585D7244",
                  "inpColumnName": "inppaymentmethodname",
                  "length": 60,
                  "name": "paymentMethodName",
                  "title": "Payment Method",
                  "type": "_id_10"
                },
                {
                  "columnName": "businessPartnerName",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 60,
                    "length": 60,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 4
                  },
                  "id": "E40D003712A2492395ACB57BFBFE6720",
                  "inpColumnName": "inpbusinesspartnername",
                  "length": 60,
                  "name": "businessPartnerName",
                  "title": "Business Partner",
                  "type": "_id_10"
                },
                {
                  "columnName": "expectedDate",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 5
                  },
                  "id": "386D0D471C7C452C9A3F120D5AA5883F",
                  "inpColumnName": "inpexpecteddate",
                  "length": 60,
                  "name": "expectedDate",
                  "title": "Expected Date",
                  "type": "_id_15"
                },
                {
                  "columnName": "invoicedAmount",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 6
                  },
                  "id": "873A2879B4244BFAAD00BB7F813784A7",
                  "inpColumnName": "inpinvoicedamount",
                  "name": "invoicedAmount",
                  "title": "Invoiced Amount",
                  "type": "_id_12"
                },
                {
                  "columnName": "expectedAmount",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 7
                  },
                  "id": "BAA13A396982401AAA699F5D5EDEAB40",
                  "inpColumnName": "inpexpectedamount",
                  "name": "expectedAmount",
                  "title": "Expected Amount",
                  "type": "_id_12"
                },
                {
                  "columnName": "outstandingAmount",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 8
                  },
                  "id": "F484F82EDBF04C3980CD6129A1772BE9",
                  "inpColumnName": "inpoutstandingamount",
                  "name": "outstandingAmount",
                  "title": "Outstanding Amount",
                  "type": "_id_12"
                },
                {
                  "columnName": "amount",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 9
                  },
                  "id": "35DD8B0180354F51810C33CD9364AADE",
                  "inpColumnName": "inpamount",
                  "name": "amount",
                  "onChangeFunction": "OB.APRM.AddPayment.orderInvoiceAmountOnChange",
                  "title": "Amount",
                  "type": "_id_12",
                  "validationFn": "OB.APRM.AddPayment.orderInvoiceGridValidation"
                },
                {
                  "columnName": "writeoff",
                  "gridProps": {
                    "autoFitWidth": false,
                    "canFilter": true,
                    "canGroupBy": false,
                    "canSort": true,
                    "editorProps": {
                      "showLabel": false,
                      "showTitle": false
                    },
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 10,
                    "width": "*",
                    "yesNo": true
                  },
                  "id": "003DD6B7B2014582A21C42A0688B0A1A",
                  "inpColumnName": "inpwriteoff",
                  "name": "writeoff",
                  "overflow": "visible",
                  "title": "Writeoff",
                  "type": "_id_20",
                  "width": 1
                },
                {
                  "columnName": "OB_Selected",
                  "gridProps": {
                    "autoFitWidth": false,
                    "canFilter": true,
                    "canGroupBy": false,
                    "canSort": true,
                    "editorProps": {
                      "showLabel": false,
                      "showTitle": false
                    },
                    "selectOnClick": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 11,
                    "width": "*",
                    "yesNo": true
                  },
                  "id": "DE27DC228C0C4048BE8AB2AB457364D1",
                  "inpColumnName": "inpobSelected",
                  "name": "obSelected",
                  "overflow": "visible",
                  "title": "Selected",
                  "type": "_id_20",
                  "width": 1
                },
                {
                  "columnName": "created",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 12
                  },
                  "id": "0E6D25BEE66D46B981E29778C07363E4",
                  "inpColumnName": "inpcreated",
                  "length": 19,
                  "name": "creationDate",
                  "title": "Creation Date",
                  "type": "_id_16"
                },
                {
                  "columnName": "createdBy",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 22,
                    "length": 60,
                    "selectOnClick": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 13
                  },
                  "id": "A0354628764646A7BC4015500AA67051",
                  "inpColumnName": "inpcreatedby",
                  "length": 60,
                  "name": "createdBy",
                  "required": true,
                  "title": "Created By",
                  "type": "_id_10"
                },
                {
                  "columnName": "updated",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 14
                  },
                  "id": "5C4E114603974DF28F64F7BC744E3556",
                  "inpColumnName": "inpupdated",
                  "length": 19,
                  "name": "updated",
                  "title": "Updated",
                  "type": "_id_16"
                },
                {
                  "columnName": "updatedBy",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 22,
                    "length": 60,
                    "selectOnClick": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 15
                  },
                  "id": "7BD8796B5E304465ABA28A7CCA511884",
                  "inpColumnName": "inpupdatedby",
                  "length": 60,
                  "name": "updatedBy",
                  "title": "Updated By",
                  "type": "_id_10"
                },
                {
                  "name": "_notes_",
                  "personalizable": false,
                  "type": "OBNoteSectionItem"
                },
                {
                  "name": "_notes_Canvas",
                  "personalizable": false,
                  "type": "OBNoteCanvasItem"
                },
                {
                  "name": "_linkedItems_",
                  "personalizable": false,
                  "type": "OBLinkedItemSectionItem"
                },
                {
                  "name": "_linkedItems_Canvas",
                  "personalizable": false,
                  "type": "OBLinkedItemCanvasItem"
                },
                {
                  "name": "_attachments_",
                  "personalizable": false,
                  "type": "OBAttachmentsSectionItem"
                },
                {
                  "name": "_attachments_Canvas",
                  "personalizable": false,
                  "type": "OBAttachmentCanvasItem"
                }
              ],
              "gridProperties": {
                "alias": "psd",
                "allowSummaryFunctions": false,
                "filterClause": false,
                "sortField": "salesOrderNo"
              },
              "mapping250": "/org.openbravo.advpaymentmngtOrderInvoicePE/OrderInvoicesBE20AB937FC64221A86E93ECA0DF1C1D",
              "moduleId": "A918E3331C404B889D69AA9BFAFB23AC",
              "selectionType": "M",
              "showSelect": true,
              "standardProperties": {
                "inpkeyColumnId": "35605F6EE878473E9ACCB9196452A4A6",
                "inpKeyName": "inppaymentscheduledetail",
                "inpTabId": "BE20AB937FC64221A86E93ECA0DF1C1D",
                "inpTableId": "58AF4D3E594B421A9A7307480736F03E",
                "inpwindowId": "6358D6DEB2104161B9769D107FEA54DF",
                "keyColumnName": "paymentScheduleDetail",
                "keyProperty": "id",
                "keyPropertyType": "_id_13"
              },
              "statusBarFields": [],
              "tabId": "BE20AB937FC64221A86E93ECA0DF1C1D",
              "tabTitle": "Order Invoices"
            },
            "width": "*"
          },
          {
            "defaultValue": "GL Items",
            "itemIds": ["glitem"],
            "name": "7B6B5F5475634E35A85CF7023165E50B",
            "sectionExpanded": false,
            "title": "GL Items",
            "type": "OBSectionItem"
          },
          {
            "displayedRowsNumber": 5,
            "name": "glitem",
            "onGridLoadFunction": "OB.APRM.AddPayment.glitemsOnLoadGrid",
            "paramId": "383A1B1C19674F23AF643521AEE759D8",
            "required": false,
            "showTitle": false,
            "title": "GL Item",
            "type": "OBPickEditGridItem",
            "viewProperties": {
              "allowAdd": true,
              "allowDelete": true,
              "dataSourceProperties": {
                "createClassName": "OBPickAndExecuteDataSource",
                "dataURL": "/etendo/org.openbravo.service.datasource/3C1148C0AB604DE1B51B7EA4112C325F",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "gLItem",
                    "type": "_id_95E2A8B50A254B2AAE6774B8C2F28120"
                  },
                  {
                    "name": "gLItem$_identifier"
                  },
                  {
                    "name": "businessPartner",
                    "type": "_id_95E2A8B50A254B2AAE6774B8C2F28120"
                  },
                  {
                    "name": "businessPartner$_identifier"
                  },
                  {
                    "name": "product",
                    "type": "_id_95E2A8B50A254B2AAE6774B8C2F28120"
                  },
                  {
                    "name": "product$_identifier"
                  },
                  {
                    "name": "project",
                    "type": "_id_95E2A8B50A254B2AAE6774B8C2F28120"
                  },
                  {
                    "name": "project$_identifier"
                  },
                  {
                    "name": "costCenter",
                    "type": "_id_95E2A8B50A254B2AAE6774B8C2F28120"
                  },
                  {
                    "name": "costCenter$_identifier"
                  },
                  {
                    "name": "stDimension",
                    "type": "_id_95E2A8B50A254B2AAE6774B8C2F28120"
                  },
                  {
                    "name": "stDimension$_identifier"
                  },
                  {
                    "name": "ndDimension",
                    "type": "_id_95E2A8B50A254B2AAE6774B8C2F28120"
                  },
                  {
                    "name": "ndDimension$_identifier"
                  },
                  {
                    "name": "receivedIn",
                    "type": "_id_12"
                  },
                  {
                    "name": "paidOut",
                    "type": "_id_12"
                  },
                  {
                    "name": "paymentDetails",
                    "type": "_id_19"
                  },
                  {
                    "name": "paymentDetails$_identifier"
                  },
                  {
                    "name": "obSelected",
                    "type": "_id_20"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_className": "OBPickAndExecuteDataSource",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier",
                    "tableId": "864A35C8FCD548B0AD1D69C89BBA6118"
                  }
                }
              },
              "entity": "aprm_gl_item",
              "fields": [
                {
                  "columnName": "c_glitem_id",
                  "datatouce": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/FinancialMgmtGLItem",
                    "fields": [
                      {
                        "name": "id",
                        "primaryKey": true,
                        "type": "_id_13"
                      },
                      {
                        "name": "client",
                        "type": "_id_19"
                      },
                      {
                        "name": "client$_identifier"
                      },
                      {
                        "name": "organization",
                        "type": "_id_19"
                      },
                      {
                        "name": "organization$_identifier"
                      },
                      {
                        "name": "active",
                        "type": "_id_20"
                      },
                      {
                        "name": "creationDate",
                        "type": "_id_16"
                      },
                      {
                        "name": "createdBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "createdBy$_identifier"
                      },
                      {
                        "name": "updated",
                        "type": "_id_16"
                      },
                      {
                        "name": "updatedBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "updatedBy$_identifier"
                      },
                      {
                        "name": "name",
                        "type": "_id_10"
                      },
                      {
                        "name": "description",
                        "type": "_id_14"
                      },
                      {
                        "name": "enableInCash",
                        "type": "_id_20"
                      },
                      {
                        "name": "enableInFinancialInvoices",
                        "type": "_id_20"
                      },
                      {
                        "name": "taxCategory",
                        "type": "_id_19"
                      },
                      {
                        "name": "taxCategory$_identifier"
                      },
                      {
                        "name": "tax",
                        "type": "_id_19"
                      },
                      {
                        "name": "tax$_identifier"
                      },
                      {
                        "name": "withholding",
                        "type": "_id_19"
                      },
                      {
                        "name": "withholding$_identifier"
                      },
                      {
                        "additional": true,
                        "name": "name",
                        "type": "_id_10"
                      }
                    ],
                    "requestProperties": {
                      "params": {
                        "_extraProperties": "name",
                        "adTabId": "D6E031B95C004672B30AB1E3543E0A07",
                        "columnName": "c_glitem_id",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "gLItem"
                      }
                    }
                  },
                  "defaultPopupFilterField": "name",
                  "displayField": "_identifier",
                  "extraSearchFields": ["name"],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": false,
                    "canSort": false,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 1
                  },
                  "id": "517BDEDF59864EC299401A9C39D72F2B",
                  "inpColumnName": "inpcGlitemId",
                  "name": "gLItem",
                  "outFields": {},
                  "outHiddenInputPrefix": "inpcGlitemId",
                  "pickListFields": [
                    {
                      "name": "_identifier",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "C_Glitem_ID",
                  "required": true,
                  "selectorDefinitionId": "9FAD469CE4414A25974CF45C0AD22D35",
                  "selectorGridFields": [],
                  "showSelectorGrid": false,
                  "targetEntity": "FinancialMgmtGLItem",
                  "textMatchStyle": "substring",
                  "title": "G/L Item",
                  "type": "_id_1A6C5E0A5868417786ECCF3C02B17D65",
                  "valueField": "id"
                },
                {
                  "columnName": "C_Bpartner_ID",
                  "datosource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/BusinessPartner",
                    "fields": [
                      {
                        "name": "id",
                        "primaryKey": true,
                        "type": "_id_13"
                      },
                      {
                        "name": "client",
                        "type": "_id_19"
                      },
                      {
                        "name": "client$_identifier"
                      },
                      {
                        "name": "organization",
                        "type": "_id_19"
                      },
                      {
                        "name": "organization$_identifier"
                      },
                      {
                        "name": "active",
                        "type": "_id_20"
                      },
                      {
                        "name": "creationDate",
                        "type": "_id_16"
                      },
                      {
                        "name": "createdBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "createdBy$_identifier"
                      },
                      {
                        "name": "updated",
                        "type": "_id_16"
                      },
                      {
                        "name": "updatedBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "updatedBy$_identifier"
                      },
                      {
                        "name": "searchKey",
                        "type": "_id_10"
                      },
                      {
                        "name": "name",
                        "type": "_id_10"
                      },
                      {
                        "name": "name2",
                        "type": "_id_10"
                      },
                      {
                        "name": "description",
                        "type": "_id_10"
                      },
                      {
                        "name": "summaryLevel",
                        "type": "_id_20"
                      },
                      {
                        "name": "businessPartnerCategory",
                        "type": "_id_19"
                      },
                      {
                        "name": "businessPartnerCategory$_identifier"
                      },
                      {
                        "name": "oneTimeTransaction",
                        "type": "_id_20"
                      },
                      {
                        "name": "potentialCustomer",
                        "type": "_id_20"
                      },
                      {
                        "name": "vendor",
                        "type": "_id_20"
                      },
                      {
                        "name": "customer",
                        "type": "_id_20"
                      },
                      {
                        "name": "employee",
                        "type": "_id_20"
                      },
                      {
                        "name": "isSalesRepresentative",
                        "type": "_id_20"
                      },
                      {
                        "name": "referenceNo",
                        "type": "_id_10"
                      },
                      {
                        "name": "dUNS",
                        "type": "_id_10"
                      },
                      {
                        "name": "uRL",
                        "type": "_id_800101"
                      },
                      {
                        "name": "language",
                        "type": "_id_106"
                      },
                      {
                        "name": "language$_identifier"
                      },
                      {
                        "name": "taxID",
                        "type": "_id_10"
                      },
                      {
                        "name": "taxExempt",
                        "type": "_id_20"
                      },
                      {
                        "name": "invoiceSchedule",
                        "type": "_id_19"
                      },
                      {
                        "name": "invoiceSchedule$_identifier"
                      },
                      {
                        "name": "valuation",
                        "type": "_id_10"
                      },
                      {
                        "name": "volumeOfSales",
                        "type": "_id_12"
                      },
                      {
                        "name": "noOfEmployees",
                        "type": "_id_11"
                      },
                      {
                        "name": "nAICSSIC",
                        "type": "_id_10"
                      },
                      {
                        "name": "dateOfFirstSale",
                        "type": "_id_15"
                      },
                      {
                        "name": "acquisitionCost",
                        "type": "_id_12"
                      },
                      {
                        "name": "expectedLifetimeRevenue",
                        "type": "_id_12"
                      },
                      {
                        "name": "lifetimeRevenueToDate",
                        "type": "_id_12"
                      },
                      {
                        "name": "share",
                        "type": "_id_11"
                      },
                      {
                        "name": "formOfPayment",
                        "type": "_id_195",
                        "valueMap": {
                          "1": "Wire Transfer",
                          "2": "Check",
                          "3": "Promissory Note",
                          "4": "Money Order",
                          "5": "Bank Deposit",
                          "B": "Cash",
                          "C": "Cash on Delivery",
                          "K": "Credit Card",
                          "P": "On Credit",
                          "R": "Bank Remittance",
                          "W": "Withholding"
                        }
                      },
                      {
                        "name": "creditLimit",
                        "type": "_id_12"
                      },
                      {
                        "name": "creditUsed",
                        "type": "_id_12"
                      },
                      {
                        "name": "paymentTerms",
                        "type": "_id_19"
                      },
                      {
                        "name": "paymentTerms$_identifier"
                      },
                      {
                        "name": "priceList",
                        "type": "_id_166"
                      },
                      {
                        "name": "priceList$_identifier"
                      },
                      {
                        "name": "printDiscount",
                        "type": "_id_20"
                      },
                      {
                        "name": "orderDescription",
                        "type": "_id_10"
                      },
                      {
                        "name": "orderReference",
                        "type": "_id_10"
                      },
                      {
                        "name": "pOFormOfPayment",
                        "type": "_id_195",
                        "valueMap": {
                          "1": "Wire Transfer",
                          "2": "Check",
                          "3": "Promissory Note",
                          "4": "Money Order",
                          "5": "Bank Deposit",
                          "B": "Cash",
                          "C": "Cash on Delivery",
                          "K": "Credit Card",
                          "P": "On Credit",
                          "R": "Bank Remittance",
                          "W": "Withholding"
                        }
                      },
                      {
                        "name": "purchasePricelist",
                        "type": "_id_800031"
                      },
                      {
                        "name": "purchasePricelist$_identifier"
                      },
                      {
                        "name": "pOPaymentTerms",
                        "type": "_id_227"
                      },
                      {
                        "name": "pOPaymentTerms$_identifier"
                      },
                      {
                        "name": "numberOfCopies",
                        "type": "_id_11"
                      },
                      {
                        "name": "greeting",
                        "type": "_id_19"
                      },
                      {
                        "name": "greeting$_identifier"
                      },
                      {
                        "name": "invoiceTerms",
                        "type": "_id_150",
                        "valueMap": {
                          "D": "After Delivery",
                          "I": "Immediate",
                          "N": "Do Not Invoice",
                          "O": "After Order Delivered",
                          "S": "Customer Schedule After Delivery"
                        }
                      },
                      {
                        "name": "deliveryTerms",
                        "type": "_id_151",
                        "valueMap": {
                          "A": "Availability",
                          "L": "Complete Line",
                          "O": "Complete Order",
                          "R": "After Receipt"
                        }
                      },
                      {
                        "name": "deliveryMethod",
                        "type": "_id_152",
                        "valueMap": {
                          "D": "Delivery",
                          "P": "Pickup",
                          "S": "Shipper"
                        }
                      },
                      {
                        "name": "salesRepresentative",
                        "type": "_id_187"
                      },
                      {
                        "name": "salesRepresentative$_identifier"
                      },
                      {
                        "name": "partnerParent",
                        "type": "_id_13"
                      },
                      {
                        "name": "creditStatus",
                        "type": "_id_289",
                        "valueMap": {
                          "H": "Credit Hold",
                          "O": "Credit OK",
                          "S": "Credit Stop",
                          "W": "Credit Watch",
                          "X": "No Credit Check"
                        }
                      },
                      {
                        "name": "forcedOrg",
                        "type": "_id_276"
                      },
                      {
                        "name": "forcedOrg$_identifier"
                      },
                      {
                        "name": "pricesShownInOrder",
                        "type": "_id_20"
                      },
                      {
                        "name": "invoiceGrouping",
                        "type": "_id_800026",
                        "valueMap": {
                          "000000000000000": "By customer",
                          "000000000010000": "By project",
                          "000010000000000": "By ship location"
                        }
                      },
                      {
                        "name": "maturityDate1",
                        "type": "_id_11"
                      },
                      {
                        "name": "maturityDate2",
                        "type": "_id_11"
                      },
                      {
                        "name": "maturityDate3",
                        "type": "_id_11"
                      },
                      {
                        "name": "operator",
                        "type": "_id_20"
                      },
                      {
                        "name": "uPCEAN",
                        "type": "_id_10"
                      },
                      {
                        "name": "salaryCategory",
                        "type": "_id_19"
                      },
                      {
                        "name": "salaryCategory$_identifier"
                      },
                      {
                        "name": "invoicePrintformat",
                        "type": "_id_800007",
                        "valueMap": {
                          "1": "Detail",
                          "2": "Total",
                          "3": "Product detail"
                        }
                      },
                      {
                        "name": "consumptionDays",
                        "type": "_id_11"
                      },
                      {
                        "name": "bankAccount",
                        "type": "_id_800046"
                      },
                      {
                        "name": "bankAccount$_identifier"
                      },
                      {
                        "name": "taxCategory",
                        "type": "_id_800090"
                      },
                      {
                        "name": "taxCategory$_identifier"
                      },
                      {
                        "name": "pOMaturityDate1",
                        "type": "_id_11"
                      },
                      {
                        "name": "pOMaturityDate2",
                        "type": "_id_11"
                      },
                      {
                        "name": "pOMaturityDate3",
                        "type": "_id_11"
                      },
                      {
                        "name": "transactionalBankAccount",
                        "type": "_id_800046"
                      },
                      {
                        "name": "transactionalBankAccount$_identifier"
                      },
                      {
                        "name": "sOBPTaxCategory",
                        "type": "_id_800090"
                      },
                      {
                        "name": "sOBPTaxCategory$_identifier"
                      },
                      {
                        "name": "fiscalcode",
                        "type": "_id_10"
                      },
                      {
                        "name": "isofiscalcode",
                        "type": "_id_10"
                      },
                      {
                        "name": "incotermsPO",
                        "type": "_id_D2D4CC1F12434BB69733166A9423F2C6"
                      },
                      {
                        "name": "incotermsPO$_identifier"
                      },
                      {
                        "name": "incotermsSO",
                        "type": "_id_D2D4CC1F12434BB69733166A9423F2C6"
                      },
                      {
                        "name": "incotermsSO$_identifier"
                      },
                      {
                        "name": "paymentMethod",
                        "type": "_id_EED0EF97D4A7421687F3B365D009E7A6"
                      },
                      {
                        "name": "paymentMethod$_identifier"
                      },
                      {
                        "name": "pOPaymentMethod",
                        "type": "_id_EED0EF97D4A7421687F3B365D009E7A6"
                      },
                      {
                        "name": "pOPaymentMethod$_identifier"
                      },
                      {
                        "name": "account",
                        "type": "_id_DF1CEA94B3564A33AFDB37C07E1CE353"
                      },
                      {
                        "name": "account$_identifier"
                      },
                      {
                        "name": "pOFinancialAccount",
                        "type": "_id_DF1CEA94B3564A33AFDB37C07E1CE353"
                      },
                      {
                        "name": "pOFinancialAccount$_identifier"
                      },
                      {
                        "name": "customerBlocking",
                        "type": "_id_20"
                      },
                      {
                        "name": "vendorBlocking",
                        "type": "_id_20"
                      },
                      {
                        "name": "paymentIn",
                        "type": "_id_20"
                      },
                      {
                        "name": "paymentOut",
                        "type": "_id_20"
                      },
                      {
                        "name": "salesInvoice",
                        "type": "_id_20"
                      },
                      {
                        "name": "purchaseInvoice",
                        "type": "_id_20"
                      },
                      {
                        "name": "salesOrder",
                        "type": "_id_20"
                      },
                      {
                        "name": "purchaseOrder",
                        "type": "_id_20"
                      },
                      {
                        "name": "goodsShipment",
                        "type": "_id_20"
                      },
                      {
                        "name": "goodsReceipt",
                        "type": "_id_20"
                      },
                      {
                        "name": "cashVAT",
                        "type": "_id_20"
                      },
                      {
                        "name": "setNewCurrency",
                        "type": "_id_28"
                      },
                      {
                        "name": "currency",
                        "type": "_id_112"
                      },
                      {
                        "name": "currency$_identifier"
                      },
                      {
                        "name": "birthPlace",
                        "type": "_id_10"
                      },
                      {
                        "name": "birthDay",
                        "type": "_id_15"
                      },
                      {
                        "name": "isCustomerConsent",
                        "type": "_id_20"
                      },
                      {
                        "additional": true,
                        "name": "searchKey",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "businessPartnerCategory$name",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "vendor",
                        "type": "_id_20"
                      },
                      {
                        "additional": true,
                        "name": "name",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "customer",
                        "type": "_id_20"
                      }
                    ],
                    "requestProperties": {
                      "params": {
                        "_extraProperties": "searchKey,businessPartnerCategory$name,vendor,name,customer",
                        "adTabId": "D6E031B95C004672B30AB1E3543E0A07",
                        "columnName": "C_Bpartner_ID",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "businessPartner"
                      }
                    }
                  },
                  "defaultPopupFilterField": "name",
                  "displayField": "_identifier",
                  "extraSearchFields": [
                    "searchKey",
                    "businessPartnerCategory$name",
                    "name"
                  ],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": false,
                    "canSort": false,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 2
                  },
                  "id": "82DD3C7755B049EA9D180845CA244600",
                  "inpColumnName": "inpcBpartnerId",
                  "name": "businessPartner",
                  "outFields": {},
                  "outHiddenInputPrefix": "inpcBpartnerId",
                  "pickListFields": [
                    {
                      "name": "_identifier",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "C_BPartner_ID",
                  "selectorDefinitionId": "A98899B1C75A4F4EBD3414F1B654EFAB",
                  "selectorGridFields": [
                    {
                      "name": "name",
                      "showHover": true,
                      "title": "Commercial Name",
                      "type": "_id_10"
                    },
                    {
                      "name": "searchKey",
                      "showHover": true,
                      "title": "Search Key",
                      "type": "_id_10"
                    },
                    {
                      "name": "businessPartnerCategory$name",
                      "showHover": true,
                      "title": "Business Partner Category",
                      "type": "_id_10"
                    },
                    {
                      "name": "customer",
                      "showHover": true,
                      "title": "Customer",
                      "type": "_id_20"
                    },
                    {
                      "name": "vendor",
                      "showHover": true,
                      "title": "Vendor",
                      "type": "_id_20"
                    }
                  ],
                  "showSelectorGrid": true,
                  "targetEntity": "BusinessPartner",
                  "textMatchStyle": "substring",
                  "title": "Business Partner",
                  "type": "_id_56DEFF37A33F46D1AC918C97C4447EAF",
                  "valueField": "id"
                },
                {
                  "columnName": "M_Product_ID",
                  "datasource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/F8DD408F2F3A414188668836F84C21AF",
                    "fields": [],
                    "requestProperties": {
                      "params": {
                        "_extraProperties": "chDescription,standardPrice,netListPrice,searchKey,priceLimit,uOM$_identifier,productName,priceListVersion,genericProduct,currency$_identifier,id$_identifier,salesPriceList,priceListVersionName",
                        "adTabId": "D6E031B95C004672B30AB1E3543E0A07",
                        "columnName": "M_Product_ID",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "product"
                      }
                    }
                  },
                  "defaultPopupFilterField": "productName",
                  "displayField": "productName",
                  "extraSearchFields": ["searchKey"],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": false,
                    "canSort": false,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 3
                  },
                  "id": "D24E8C7FEF654C23B14B83A108F17CEC",
                  "inpColumnName": "inpmProductId",
                  "name": "product",
                  "outFields": {
                    "currency": {
                      "fieldName": "currency",
                      "formatType": "",
                      "suffix": "_CURR"
                    },
                    "netListPrice": {
                      "fieldName": "netListPrice",
                      "formatType": "",
                      "suffix": "_PLIST"
                    },
                    "priceLimit": {
                      "fieldName": "priceLimit",
                      "formatType": "",
                      "suffix": "_PLIM"
                    },
                    "standardPrice": {
                      "fieldName": "standardPrice",
                      "formatType": "",
                      "suffix": "_PSTD"
                    },
                    "uOM": {
                      "fieldName": "uOM",
                      "formatType": "",
                      "suffix": "_UOM"
                    }
                  },
                  "outHiddenInputPrefix": "inpmProductId",
                  "pickListFields": [
                    {
                      "name": "productName",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "M_Product_ID",
                  "selectorDefinitionId": "EB3C41F0973A4EDA91E475833792A6D4",
                  "selectorGridFields": [
                    {
                      "name": "searchKey",
                      "showHover": true,
                      "title": "Search Key",
                      "type": "_id_10"
                    },
                    {
                      "name": "productName",
                      "showHover": true,
                      "title": "Name",
                      "type": "_id_10"
                    },
                    {
                      "name": "chDescription",
                      "showHover": true,
                      "title": "Characteristic Description",
                      "type": "_id_C632F1CFF5A1453EB28BDF44A70478F8"
                    },
                    {
                      "filterOnKeypress": false,
                      "name": "standardPrice",
                      "showHover": true,
                      "title": "Unit Price",
                      "type": "_id_800008"
                    },
                    {
                      "filterOnKeypress": false,
                      "name": "netListPrice",
                      "showHover": true,
                      "title": "List Price",
                      "type": "_id_800008"
                    },
                    {
                      "name": "priceListVersionName",
                      "showHover": true,
                      "title": "Price List Version",
                      "type": "_id_10"
                    },
                    {
                      "filterOnKeypress": false,
                      "name": "priceLimit",
                      "showHover": true,
                      "title": "Price Limit",
                      "type": "_id_800008"
                    },
                    {
                      "name": "genericProduct",
                      "showHover": true,
                      "title": "Generic Product",
                      "type": "_id_10"
                    }
                  ],
                  "showSelectorGrid": true,
                  "targetEntity": "Product",
                  "textMatchStyle": "substring",
                  "title": "Product",
                  "type": "_id_712D9821BE8246AC95E6C16D8BEEBE5E",
                  "valueField": "id"
                },
                {
                  "columnName": "C_Project_ID",
                  "datasource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/Project",
                    "fields": [
                      {
                        "name": "id",
                        "primaryKey": true,
                        "type": "_id_13"
                      },
                      {
                        "name": "client",
                        "type": "_id_19"
                      },
                      {
                        "name": "client$_identifier"
                      },
                      {
                        "name": "organization",
                        "type": "_id_19"
                      },
                      {
                        "name": "organization$_identifier"
                      },
                      {
                        "name": "active",
                        "type": "_id_20"
                      },
                      {
                        "name": "creationDate",
                        "type": "_id_16"
                      },
                      {
                        "name": "createdBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "createdBy$_identifier"
                      },
                      {
                        "name": "updated",
                        "type": "_id_16"
                      },
                      {
                        "name": "updatedBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "updatedBy$_identifier"
                      },
                      {
                        "name": "searchKey",
                        "type": "_id_10"
                      },
                      {
                        "name": "name",
                        "type": "_id_10"
                      },
                      {
                        "name": "description",
                        "type": "_id_14"
                      },
                      {
                        "name": "comments",
                        "type": "_id_14"
                      },
                      {
                        "name": "summaryLevel",
                        "type": "_id_20"
                      },
                      {
                        "name": "userContact",
                        "type": "_id_19"
                      },
                      {
                        "name": "userContact$_identifier"
                      },
                      {
                        "name": "businessPartner",
                        "type": "_id_800057"
                      },
                      {
                        "name": "businessPartner$_identifier"
                      },
                      {
                        "name": "partnerAddress",
                        "type": "_id_19"
                      },
                      {
                        "name": "partnerAddress$_identifier"
                      },
                      {
                        "name": "orderReference",
                        "type": "_id_10"
                      },
                      {
                        "name": "paymentTerms",
                        "type": "_id_19"
                      },
                      {
                        "name": "paymentTerms$_identifier"
                      },
                      {
                        "name": "currency",
                        "type": "_id_19"
                      },
                      {
                        "name": "currency$_identifier"
                      },
                      {
                        "name": "createTemporaryPriceList",
                        "type": "_id_20"
                      },
                      {
                        "name": "priceListVersion",
                        "type": "_id_19"
                      },
                      {
                        "name": "priceListVersion$_identifier"
                      },
                      {
                        "name": "salesCampaign",
                        "type": "_id_19"
                      },
                      {
                        "name": "salesCampaign$_identifier"
                      },
                      {
                        "name": "legallyBindingContract",
                        "type": "_id_20"
                      },
                      {
                        "name": "plannedAmount",
                        "type": "_id_12"
                      },
                      {
                        "name": "plannedQuantity",
                        "type": "_id_29"
                      },
                      {
                        "name": "plannedMargin",
                        "type": "_id_12"
                      },
                      {
                        "name": "contractAmount",
                        "type": "_id_12"
                      },
                      {
                        "name": "contractDate",
                        "type": "_id_15"
                      },
                      {
                        "name": "endingDate",
                        "type": "_id_15"
                      },
                      {
                        "name": "generateTo",
                        "type": "_id_28"
                      },
                      {
                        "name": "processed",
                        "type": "_id_20"
                      },
                      {
                        "name": "salesRepresentative",
                        "type": "_id_190"
                      },
                      {
                        "name": "salesRepresentative$_identifier"
                      },
                      {
                        "name": "copyFrom",
                        "type": "_id_28"
                      },
                      {
                        "name": "projectType",
                        "type": "_id_19"
                      },
                      {
                        "name": "projectType$_identifier"
                      },
                      {
                        "name": "contractQuantity",
                        "type": "_id_29"
                      },
                      {
                        "name": "invoiceAmount",
                        "type": "_id_12"
                      },
                      {
                        "name": "invoiceQuantity",
                        "type": "_id_29"
                      },
                      {
                        "name": "projectBalance",
                        "type": "_id_12"
                      },
                      {
                        "name": "standardPhase",
                        "type": "_id_19"
                      },
                      {
                        "name": "standardPhase$_identifier"
                      },
                      {
                        "name": "projectPhase",
                        "type": "_id_19"
                      },
                      {
                        "name": "projectPhase$_identifier"
                      },
                      {
                        "name": "priceCeiling",
                        "type": "_id_20"
                      },
                      {
                        "name": "warehouse",
                        "type": "_id_19"
                      },
                      {
                        "name": "warehouse$_identifier"
                      },
                      {
                        "name": "projectCategory",
                        "type": "_id_288",
                        "valueMap": {
                          "S": "Multiphase Project"
                        }
                      },
                      {
                        "name": "processNow",
                        "type": "_id_28"
                      },
                      {
                        "name": "initiativeType",
                        "type": "_id_800005",
                        "valueMap": {
                          "PR": "Private",
                          "PU": "Public"
                        }
                      },
                      {
                        "name": "projectStatus",
                        "type": "_id_800002",
                        "valueMap": {
                          "OC": "Order closed",
                          "OP": "Open",
                          "OR": "Order"
                        }
                      },
                      {
                        "name": "workType",
                        "type": "_id_800004",
                        "valueMap": {
                          "RE": "Reinforcement",
                          "RO": "Road",
                          "WA": "Wall"
                        }
                      },
                      {
                        "name": "invoiceAddress",
                        "type": "_id_159"
                      },
                      {
                        "name": "invoiceAddress$_identifier"
                      },
                      {
                        "name": "phase",
                        "type": "_id_800003",
                        "valueMap": {
                          "AC": "Awarded a contract to",
                          "PR": "Project",
                          "TE": "Tender"
                        }
                      },
                      {
                        "name": "generateOrder",
                        "type": "_id_28"
                      },
                      {
                        "name": "changeProjectStatus",
                        "type": "_id_800002"
                      },
                      {
                        "name": "locationAddress",
                        "type": "_id_21"
                      },
                      {
                        "name": "locationAddress$_identifier"
                      },
                      {
                        "name": "priceList",
                        "type": "_id_19"
                      },
                      {
                        "name": "priceList$_identifier"
                      },
                      {
                        "name": "formOfPayment",
                        "type": "_id_195",
                        "valueMap": {
                          "1": "Wire Transfer",
                          "2": "Check",
                          "3": "Promissory Note",
                          "4": "Money Order",
                          "5": "Bank Deposit",
                          "B": "Cash",
                          "C": "Cash on Delivery",
                          "K": "Credit Card",
                          "P": "On Credit",
                          "R": "Bank Remittance",
                          "W": "Withholding"
                        }
                      },
                      {
                        "name": "invoiceToProject",
                        "type": "_id_20"
                      },
                      {
                        "name": "plannedPoAmount",
                        "type": "_id_12"
                      },
                      {
                        "name": "lastPlannedProposalDate",
                        "type": "_id_15"
                      },
                      {
                        "name": "numberOfCopies",
                        "type": "_id_11"
                      },
                      {
                        "name": "accountNo",
                        "type": "_id_10"
                      },
                      {
                        "name": "plannedExpenses",
                        "type": "_id_22"
                      },
                      {
                        "name": "expensesMargin",
                        "type": "_id_22"
                      },
                      {
                        "name": "reinvoicedExpenses",
                        "type": "_id_22"
                      },
                      {
                        "name": "personInCharge",
                        "type": "_id_800093"
                      },
                      {
                        "name": "personInCharge$_identifier"
                      },
                      {
                        "name": "serviceCost",
                        "type": "_id_22"
                      },
                      {
                        "name": "serviceMargin",
                        "type": "_id_22"
                      },
                      {
                        "name": "serviceRevenue",
                        "type": "_id_22"
                      },
                      {
                        "name": "setProjectType",
                        "type": "_id_28"
                      },
                      {
                        "name": "startingDate",
                        "type": "_id_15"
                      },
                      {
                        "name": "servicesProvidedCost",
                        "type": "_id_22"
                      },
                      {
                        "name": "outsourcedCost",
                        "type": "_id_22"
                      },
                      {
                        "name": "paymentMethod",
                        "type": "_id_19"
                      },
                      {
                        "name": "paymentMethod$_identifier"
                      },
                      {
                        "additional": true,
                        "name": "searchKey",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "name",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "businessPartner$name",
                        "type": "_id_10"
                      }
                    ],
                    "requestProperties": {
                      "params": {
                        "_extraProperties": "searchKey,name",
                        "adTabId": "D6E031B95C004672B30AB1E3543E0A07",
                        "columnName": "C_Project_ID",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "project"
                      }
                    }
                  },
                  "defaultPopupFilterField": "searchKey",
                  "displayField": "_identifier",
                  "extraSearchFields": ["name"],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": false,
                    "canSort": false,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 4
                  },
                  "id": "E063BE3DA82B4E3AA0B3A3BC52CD7826",
                  "inpColumnName": "inpcProjectId",
                  "name": "project",
                  "outFields": {},
                  "outHiddenInputPrefix": "inpcProjectId",
                  "pickListFields": [
                    {
                      "name": "_identifier",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "C_Project_ID",
                  "selectorDefinitionId": "FF808181312D569C01312D90408D005D",
                  "selectorGridFields": [
                    {
                      "name": "searchKey",
                      "showHover": true,
                      "title": "Search Key",
                      "type": "_id_10"
                    },
                    {
                      "name": "name",
                      "showHover": true,
                      "title": "Name",
                      "type": "_id_10"
                    }
                  ],
                  "showSelectorGrid": true,
                  "targetEntity": "Project",
                  "textMatchStyle": "substring",
                  "title": "Project",
                  "type": "_id_FF808181312D569C01312D8FA681005A",
                  "valueField": "id"
                },
                {
                  "columnName": "C_CostCenter_ID",
                  "datasource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/Costcenter",
                    "fields": [
                      {
                        "name": "id",
                        "primaryKey": true,
                        "type": "_id_13"
                      },
                      {
                        "name": "client",
                        "type": "_id_19"
                      },
                      {
                        "name": "client$_identifier"
                      },
                      {
                        "name": "organization",
                        "type": "_id_19"
                      },
                      {
                        "name": "organization$_identifier"
                      },
                      {
                        "name": "active",
                        "type": "_id_20"
                      },
                      {
                        "name": "creationDate",
                        "type": "_id_16"
                      },
                      {
                        "name": "createdBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "createdBy$_identifier"
                      },
                      {
                        "name": "updated",
                        "type": "_id_16"
                      },
                      {
                        "name": "updatedBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "updatedBy$_identifier"
                      },
                      {
                        "name": "searchKey",
                        "type": "_id_10"
                      },
                      {
                        "name": "name",
                        "type": "_id_10"
                      },
                      {
                        "name": "description",
                        "type": "_id_10"
                      },
                      {
                        "name": "summaryLevel",
                        "type": "_id_20"
                      },
                      {
                        "additional": true,
                        "name": "searchKey",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "name",
                        "type": "_id_10"
                      }
                    ],
                    "requestProperties": {
                      "params": {
                        "_extraProperties": "searchKey,name",
                        "adTabId": "D6E031B95C004672B30AB1E3543E0A07",
                        "columnName": "C_CostCenter_ID",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "costCenter"
                      }
                    }
                  },
                  "defaultPopupFilterField": "name",
                  "displayField": "_identifier",
                  "extraSearchFields": [],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": false,
                    "canSort": false,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 5
                  },
                  "id": "7471D2AA5E0C40E0B4E250FD7EA121BE",
                  "inpColumnName": "inpcCostcenterId",
                  "name": "costCenter",
                  "outFields": {},
                  "outHiddenInputPrefix": "inpcCostcenterId",
                  "pickListFields": [
                    {
                      "name": "_identifier",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "C_Costcenter_ID",
                  "selectorDefinitionId": "B8321631F57E463EB617289E936BAF3A",
                  "selectorGridFields": [
                    {
                      "name": "searchKey",
                      "showHover": true,
                      "title": "Search Key",
                      "type": "_id_10"
                    },
                    {
                      "name": "name",
                      "showHover": true,
                      "title": "Name",
                      "type": "_id_10"
                    }
                  ],
                  "showSelectorGrid": true,
                  "targetEntity": "Costcenter",
                  "textMatchStyle": "substring",
                  "title": "Cost Center",
                  "type": "_id_DEE6B917B36D4648B2DA729FC2872CF4",
                  "valueField": "id"
                },
                {
                  "columnName": "User1_ID",
                  "datasource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/UserDimension1",
                    "fields": [
                      {
                        "name": "id",
                        "primaryKey": true,
                        "type": "_id_13"
                      },
                      {
                        "name": "client",
                        "type": "_id_19"
                      },
                      {
                        "name": "client$_identifier"
                      },
                      {
                        "name": "organization",
                        "type": "_id_19"
                      },
                      {
                        "name": "organization$_identifier"
                      },
                      {
                        "name": "active",
                        "type": "_id_20"
                      },
                      {
                        "name": "creationDate",
                        "type": "_id_16"
                      },
                      {
                        "name": "createdBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "createdBy$_identifier"
                      },
                      {
                        "name": "updated",
                        "type": "_id_16"
                      },
                      {
                        "name": "updatedBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "updatedBy$_identifier"
                      },
                      {
                        "name": "searchKey",
                        "type": "_id_10"
                      },
                      {
                        "name": "name",
                        "type": "_id_10"
                      },
                      {
                        "name": "description",
                        "type": "_id_10"
                      },
                      {
                        "name": "summaryLevel",
                        "type": "_id_20"
                      },
                      {
                        "additional": true,
                        "name": "searchKey",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "name",
                        "type": "_id_10"
                      }
                    ],
                    "requestProperties": {
                      "params": {
                        "_extraProperties": "searchKey,name",
                        "adTabId": "D6E031B95C004672B30AB1E3543E0A07",
                        "columnName": "User1_ID",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "stDimension"
                      }
                    }
                  },
                  "defaultPopupFilterField": "name",
                  "displayField": "_identifier",
                  "extraSearchFields": [],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": false,
                    "canSort": false,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 6
                  },
                  "id": "9AF76E97875345F587C9DD8F64B96431",
                  "inpColumnName": "inpuser1Id",
                  "name": "stDimension",
                  "outFields": {},
                  "outHiddenInputPrefix": "inpuser1Id",
                  "pickListFields": [
                    {
                      "name": "_identifier",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "User1_ID",
                  "selectorDefinitionId": "814758DD755642E9BF38BD2E5AD713EC",
                  "selectorGridFields": [
                    {
                      "name": "searchKey",
                      "showHover": true,
                      "title": "Search Key",
                      "type": "_id_10"
                    },
                    {
                      "name": "name",
                      "showHover": true,
                      "title": "Name",
                      "type": "_id_10"
                    }
                  ],
                  "showSelectorGrid": true,
                  "targetEntity": "UserDimension1",
                  "textMatchStyle": "substring",
                  "title": "1st Dimension",
                  "type": "_id_0E0D1661E18E4E05A118785A7CF146B8",
                  "valueField": "id"
                },
                {
                  "columnName": "User2_ID",
                  "datasource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/UserDimension2",
                    "fields": [
                      {
                        "name": "id",
                        "primaryKey": true,
                        "type": "_id_13"
                      },
                      {
                        "name": "client",
                        "type": "_id_19"
                      },
                      {
                        "name": "client$_identifier"
                      },
                      {
                        "name": "organization",
                        "type": "_id_19"
                      },
                      {
                        "name": "organization$_identifier"
                      },
                      {
                        "name": "active",
                        "type": "_id_20"
                      },
                      {
                        "name": "creationDate",
                        "type": "_id_16"
                      },
                      {
                        "name": "createdBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "createdBy$_identifier"
                      },
                      {
                        "name": "updated",
                        "type": "_id_16"
                      },
                      {
                        "name": "updatedBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "updatedBy$_identifier"
                      },
                      {
                        "name": "searchKey",
                        "type": "_id_10"
                      },
                      {
                        "name": "name",
                        "type": "_id_10"
                      },
                      {
                        "name": "description",
                        "type": "_id_10"
                      },
                      {
                        "name": "summaryLevel",
                        "type": "_id_20"
                      },
                      {
                        "additional": true,
                        "name": "name",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "searchKey",
                        "type": "_id_10"
                      }
                    ],
                    "requestProperties": {
                      "params": {
                        "_extraProperties": "name,searchKey",
                        "adTabId": "D6E031B95C004672B30AB1E3543E0A07",
                        "columnName": "User2_ID",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "ndDimension"
                      }
                    }
                  },
                  "defaultPopupFilterField": "name",
                  "displayField": "_identifier",
                  "extraSearchFields": [],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": false,
                    "canSort": false,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 7
                  },
                  "id": "1A5F56A5E63A4A04AFED8E0B615B3740",
                  "inpColumnName": "inpuser2Id",
                  "name": "ndDimension",
                  "outFields": {},
                  "outHiddenInputPrefix": "inpuser2Id",
                  "pickListFields": [
                    {
                      "name": "_identifier",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "User2_ID",
                  "selectorDefinitionId": "BD1DA40E134A42B9889B529302A96871",
                  "selectorGridFields": [
                    {
                      "name": "searchKey",
                      "showHover": true,
                      "title": "Search Key",
                      "type": "_id_10"
                    },
                    {
                      "name": "name",
                      "showHover": true,
                      "title": "Name",
                      "type": "_id_10"
                    }
                  ],
                  "showSelectorGrid": true,
                  "targetEntity": "UserDimension2",
                  "textMatchStyle": "substring",
                  "title": "2nd Dimension",
                  "type": "_id_1850A5390D97470EBB35A3A5F43AB533",
                  "valueField": "id"
                },
                {
                  "columnName": "received_in",
                  "gridProps": {
                    "canFilter": false,
                    "canSort": false,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 8
                  },
                  "id": "2886ECF017774201A61189927EE22E58",
                  "inpColumnName": "inpreceivedIn",
                  "name": "receivedIn",
                  "onChangeFunction": "OB.APRM.AddPayment.glItemAmountOnChange",
                  "required": true,
                  "title": "Received In",
                  "type": "_id_12"
                },
                {
                  "columnName": "paid_out",
                  "gridProps": {
                    "canFilter": false,
                    "canSort": false,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 9
                  },
                  "id": "3D7C9D03C1AB4FFBB46F3A84B24BEA2C",
                  "inpColumnName": "inppaidOut",
                  "name": "paidOut",
                  "onChangeFunction": "OB.APRM.AddPayment.glItemAmountOnChange",
                  "required": true,
                  "title": "Paid Out",
                  "type": "_id_12"
                },
                {
                  "columnName": "OB_Selected",
                  "gridProps": {
                    "autoFitWidth": false,
                    "canFilter": false,
                    "canGroupBy": false,
                    "canSort": false,
                    "editorProps": {
                      "showLabel": false,
                      "showTitle": false
                    },
                    "selectOnClick": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 10,
                    "width": "*",
                    "yesNo": true
                  },
                  "id": "F9FC9AA82AA48066E040007F01002B96",
                  "inpColumnName": "inpobSelected",
                  "name": "obSelected",
                  "overflow": "visible",
                  "title": "c_ob_selected",
                  "type": "_id_20",
                  "width": 1
                },
                {
                  "defaultValue": "Audit",
                  "itemIds": [
                    "creationDate",
                    "createdBy",
                    "updated",
                    "updatedBy"
                  ],
                  "name": "1000100001",
                  "personalizable": false,
                  "title": "Audit",
                  "type": "OBAuditSectionItem"
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "creationDate",
                  "personalizable": false,
                  "title": "Creation Date",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "createdBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "createdBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Created By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updated",
                  "personalizable": false,
                  "title": "Updated",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "updatedBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updatedBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Updated By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "name": "_notes_",
                  "personalizable": false,
                  "type": "OBNoteSectionItem"
                },
                {
                  "name": "_notes_Canvas",
                  "personalizable": false,
                  "type": "OBNoteCanvasItem"
                },
                {
                  "name": "_linkedItems_",
                  "personalizable": false,
                  "type": "OBLinkedItemSectionItem"
                },
                {
                  "name": "_linkedItems_Canvas",
                  "personalizable": false,
                  "type": "OBLinkedItemCanvasItem"
                },
                {
                  "name": "_attachments_",
                  "personalizable": false,
                  "type": "OBAttachmentsSectionItem"
                },
                {
                  "name": "_attachments_Canvas",
                  "personalizable": false,
                  "type": "OBAttachmentCanvasItem"
                }
              ],
              "gridProperties": {
                "alias": "psd",
                "allowSummaryFunctions": false,
                "filterClause": false
              },
              "mapping250": "/org.openbravo.advpaymentmngtAPRMGLItem/GLItemD6E031B95C004672B30AB1E3543E0A07",
              "moduleId": "A918E3331C404B889D69AA9BFAFB23AC",
              "newFn": "OB.APRM.AddPayment.addNewGLItem",
              "selectionType": "M",
              "showSelect": false,
              "standardProperties": {
                "inpkeyColumnId": "4BC54D56C3014EF7A812CB5AFE860B66",
                "inpKeyName": "inpaprmGlItemId",
                "inpTabId": "D6E031B95C004672B30AB1E3543E0A07",
                "inpTableId": "864A35C8FCD548B0AD1D69C89BBA6118",
                "inpwindowId": "17BE11F1C49547048F9D29E6C95BB67E",
                "keyColumnName": "aprm_gl_item_ID",
                "keyProperty": "id",
                "keyPropertyType": "_id_13"
              },
              "statusBarFields": [],
              "tabId": "D6E031B95C004672B30AB1E3543E0A07",
              "tabTitle": "GL Item"
            },
            "width": "*"
          },
          {
            "defaultValue": "Credit To Use",
            "itemIds": ["credit_to_use"],
            "name": "CB265F2D7ACF439F9FB5EFBFA0B50363",
            "sectionExpanded": true,
            "title": "Credit To Use",
            "type": "OBSectionItem"
          },
          {
            "displayedRowsNumber": 5,
            "name": "credit_to_use",
            "onGridLoadFunction": "OB.APRM.AddPayment.creditOnLoadGrid",
            "paramId": "A801DA25DEAA404A8C651626CA31B22F",
            "required": false,
            "showTitle": false,
            "title": "Credit To Use",
            "type": "OBPickEditGridItem",
            "viewProperties": {
              "dataSourceProperties": {
                "createClassName": "OBPickAndExecuteDataSource",
                "dataURL": "/etendo/org.openbravo.service.datasource/3C1148C0AB604DE1B51B7EA4112C325F",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "documentNo",
                    "type": "_id_10"
                  },
                  {
                    "name": "description",
                    "type": "_id_10"
                  },
                  {
                    "name": "paymentDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "outstandingAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "paymentAmount",
                    "type": "_id_12"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_className": "OBPickAndExecuteDataSource",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier",
                    "tableId": "59ED9B23854A4B048CBBAE38436B99C2"
                  }
                }
              },
              "entity": "Aprm_Credit_To_Use",
              "fields": [
                {
                  "columnName": "documentNo",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 60,
                    "length": 60,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 1
                  },
                  "id": "8A0E2CF96C0E48D69B2652BB355AA6A6",
                  "inpColumnName": "inpdocumentno",
                  "length": 60,
                  "name": "documentNo",
                  "title": "Document No.",
                  "type": "_id_10"
                },
                {
                  "name": "",
                  "personalizable": false,
                  "type": "spacer"
                },
                {
                  "colSpan": 2,
                  "columnName": "description",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 500,
                    "length": 500,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 2
                  },
                  "id": "CCC167262A6A4692BD22D05DBA77DD0C",
                  "inpColumnName": "inpdescription",
                  "length": 500,
                  "name": "description",
                  "title": "Description",
                  "type": "_id_10"
                },
                {
                  "columnName": "paymentDate",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 3
                  },
                  "id": "7D538189D5BA4F889FCFE3E6B410A671",
                  "inpColumnName": "inppaymentdate",
                  "length": 60,
                  "name": "paymentDate",
                  "title": "Payment Date",
                  "type": "_id_15"
                },
                {
                  "columnName": "outstandingAmount",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 4
                  },
                  "id": "94246C150887416DBFD264F09EE0EEA6",
                  "inpColumnName": "inpoutstandingamount",
                  "name": "outstandingAmount",
                  "title": "Outstanding Amount",
                  "type": "_id_12"
                },
                {
                  "columnName": "paymentAmount",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 5
                  },
                  "id": "1279D50CA56A45EDAD05193ED24832EA",
                  "inpColumnName": "inppaymentamount",
                  "name": "paymentAmount",
                  "onChangeFunction": "OB.APRM.AddPayment.updateCreditOnChange",
                  "title": "Payment Amount",
                  "type": "_id_12",
                  "validationFn": "OB.APRM.AddPayment.creditValidation"
                },
                {
                  "defaultValue": "Audit",
                  "itemIds": [
                    "creationDate",
                    "createdBy",
                    "updated",
                    "updatedBy"
                  ],
                  "name": "1000100001",
                  "personalizable": false,
                  "title": "Audit",
                  "type": "OBAuditSectionItem"
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "creationDate",
                  "personalizable": false,
                  "title": "Creation Date",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "createdBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "createdBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Created By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updated",
                  "personalizable": false,
                  "title": "Updated",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "updatedBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updatedBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Updated By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "name": "_notes_",
                  "personalizable": false,
                  "type": "OBNoteSectionItem"
                },
                {
                  "name": "_notes_Canvas",
                  "personalizable": false,
                  "type": "OBNoteCanvasItem"
                },
                {
                  "name": "_linkedItems_",
                  "personalizable": false,
                  "type": "OBLinkedItemSectionItem"
                },
                {
                  "name": "_linkedItems_Canvas",
                  "personalizable": false,
                  "type": "OBLinkedItemCanvasItem"
                },
                {
                  "name": "_attachments_",
                  "personalizable": false,
                  "type": "OBAttachmentsSectionItem"
                },
                {
                  "name": "_attachments_Canvas",
                  "personalizable": false,
                  "type": "OBAttachmentCanvasItem"
                }
              ],
              "gridProperties": {
                "alias": "f",
                "allowSummaryFunctions": false,
                "filterClause": false,
                "sortField": "documentNo"
              },
              "mapping250": "/org.openbravo.advpaymentmngtCreditToUse/CreditToUseE8B0F34041F244B7A5B04F5085C2A342",
              "moduleId": "A918E3331C404B889D69AA9BFAFB23AC",
              "selectionType": "M",
              "showSelect": true,
              "standardProperties": {
                "inpkeyColumnId": "9F8A320C84EF4D0982F8F6D032789CE1",
                "inpKeyName": "inpid",
                "inpTabId": "E8B0F34041F244B7A5B04F5085C2A342",
                "inpTableId": "59ED9B23854A4B048CBBAE38436B99C2",
                "inpwindowId": "81BAC97FE7754C669254C9CF4FA20292",
                "keyColumnName": "id",
                "keyProperty": "id",
                "keyPropertyType": "_id_13"
              },
              "statusBarFields": [],
              "tabId": "E8B0F34041F244B7A5B04F5085C2A342",
              "tabTitle": "Credit To Use"
            },
            "width": "*"
          },
          {
            "defaultValue": "Totals",
            "itemIds": [
              "amount_gl_items",
              "amount_inv_ords",
              "total",
              "difference",
              "document_action",
              "overpayment_action",
              "customer_credit",
              "issotrx",
              "fin_payment_id",
              "c_invoice_id",
              "c_order_id",
              "used_credit",
              "StdPrecision",
              "generateCredit",
              "DOCBASETYPE",
              "expectedDifference",
              "overpayment_action_display_logic",
              "trxtype_display_logic",
              "credit_to_use_display_logic",
              "payment_documentno_readonly_logic",
              "payment_method_readonly_logic",
              "actual_payment_readonly_logic",
              "converted_amount_readonly_logic",
              "payment_date_readonly_logic",
              "fin_financial_account_id_readonly_logic",
              "conversion_rate_readonly_logic",
              "received_from_readonly_logic",
              "c_currency_id_readonly_logic",
              "ad_org_id_display_logic",
              "bslamount_display_logic"
            ],
            "name": "BFFF70E721654110AD5BACF3D4216D3A",
            "sectionExpanded": true,
            "title": "Totals",
            "type": "OBSectionItem"
          },
          {
            "name": "amount_gl_items",
            "onChangeFunction": "OB.APRM.AddPayment.glItemTotalAmountOnChange",
            "paramId": "1FBAFF7137454F30AD8922DE75D5273F",
            "required": false,
            "title": "Amount on GL Items",
            "type": "_id_12",
            "width": "*"
          },
          {
            "name": "amount_inv_ords",
            "onChangeFunction": "OB.APRM.AddPayment.orderInvoiceTotalAmountOnChange",
            "paramId": "E91BA4DAF60B44F38D28FFFDD18F0C33",
            "required": false,
            "title": "Amount on Invoices and/or Orders",
            "type": "_id_12",
            "width": "*"
          },
          {
            "name": "total",
            "paramId": "D2F76322DF994A58B49D62E79944C219",
            "required": false,
            "title": "Total",
            "type": "_id_12",
            "width": "*"
          },
          {
            "name": "difference",
            "paramId": "7783E23035DA4DBC8DD694EBBD4A1E5F",
            "required": false,
            "title": "There is a difference of",
            "type": "_id_12",
            "width": "*"
          },
          {
            "datasource": {
              "createClassName": "",
              "dataURL": "/etendo/org.openbravo.service.datasource/ADList",
              "fields": [
                {
                  "name": "id",
                  "primaryKey": true,
                  "type": "_id_13"
                },
                {
                  "name": "client",
                  "type": "_id_19"
                },
                {
                  "name": "client$_identifier"
                },
                {
                  "name": "organization",
                  "type": "_id_19"
                },
                {
                  "name": "organization$_identifier"
                },
                {
                  "name": "active",
                  "type": "_id_20"
                },
                {
                  "name": "creationDate",
                  "type": "_id_16"
                },
                {
                  "name": "createdBy",
                  "type": "_id_30"
                },
                {
                  "name": "createdBy$_identifier"
                },
                {
                  "name": "updated",
                  "type": "_id_16"
                },
                {
                  "name": "updatedBy",
                  "type": "_id_30"
                },
                {
                  "name": "updatedBy$_identifier"
                },
                {
                  "name": "searchKey",
                  "type": "_id_10"
                },
                {
                  "name": "name",
                  "type": "_id_10"
                },
                {
                  "name": "description",
                  "type": "_id_10"
                },
                {
                  "name": "reference",
                  "type": "_id_19"
                },
                {
                  "name": "reference$_identifier"
                },
                {
                  "name": "validFromDate",
                  "type": "_id_15"
                },
                {
                  "name": "validToDate",
                  "type": "_id_15"
                },
                {
                  "name": "module",
                  "type": "_id_19"
                },
                {
                  "name": "module$_identifier"
                },
                {
                  "name": "sequenceNumber",
                  "type": "_id_11"
                }
              ],
              "requestProperties": {
                "params": {
                  "columnName": "document_action",
                  "Constants_FIELDSEPARATOR": "$",
                  "Constants_IDENTIFIER": "_identifier",
                  "IsSelectorItem": "true"
                }
              }
            },
            "defaultPopupFilterField": "_identifier",
            "displayField": "_identifier",
            "extraSearchFields": [],
            "name": "document_action",
            "outFields": {},
            "outHiddenInputPrefix": "inpdocumentAction",
            "paramId": "52BD390363394BE980D0A55AFC4CDBB9",
            "pickListFields": [
              {
                "name": "_identifier",
                "title": " ",
                "type": "text"
              }
            ],
            "popupTextMatchStyle": "substring",
            "required": true,
            "selectorDefinitionId": "41B3A5EA61AB46FBAF4567E3755BA190",
            "selectorGridFields": [],
            "showSelectorGrid": false,
            "startRow": true,
            "targetEntity": "ADList",
            "textMatchStyle": "startsWith",
            "title": "Action Regarding Document",
            "type": "_id_23AB7A87FF4E462197629E461B9F033C",
            "valueField": "id",
            "width": "*"
          },
          {
            "name": "overpayment_action",
            "paramId": "8A2B3B1A41364852ACD2804CF86A69F5",
            "required": true,
            "title": "Overpayment Action",
            "type": "_id_FCC5D21774AE4E73804F927CAB9858FE",
            "valueMap": {
              "CR": "Leave the credit to be used later",
              "RE": "Refund amount to customer"
            },
            "width": "*"
          },
          {
            "name": "customer_credit",
            "paramId": "0461CA0B15F14B81AE85FD2C81AA514A",
            "required": false,
            "title": "Customer Credit",
            "type": "_id_12",
            "width": "*"
          },
          {
            "name": "issotrx",
            "paramId": "6AF091FD5F1440BB9F0E0C674A168144",
            "required": false,
            "title": "Sales Transaction",
            "type": "_id_20",
            "width": "*"
          },
          {
            "name": "fin_payment_id",
            "paramId": "1CB6D915777343F4BD3317532345B658",
            "required": false,
            "title": "Payment",
            "type": "_id_19",
            "width": "*"
          },
          {
            "name": "c_invoice_id",
            "paramId": "FDF5AB17A1154D6AB440E1F5A02B45F5",
            "required": false,
            "title": "Invoice",
            "type": "_id_19",
            "width": "*"
          },
          {
            "name": "c_order_id",
            "paramId": "B2E975E0ADE3445C90DA81F0F492EA1C",
            "required": false,
            "title": "Order",
            "type": "_id_19",
            "width": "*"
          },
          {
            "name": "used_credit",
            "paramId": "60C455BF16B6481D8ED5336CAA3C85C7",
            "required": false,
            "title": "Used Credit",
            "type": "_id_12",
            "width": "*"
          },
          {
            "name": "StdPrecision",
            "paramId": "97DD674259364196944B4C02B0278305",
            "required": false,
            "title": "Standard Precision",
            "type": "_id_11",
            "width": "*"
          },
          {
            "name": "generateCredit",
            "paramId": "ACCFACE260B24599969EC724A567EB28",
            "required": false,
            "title": "Generate Credit",
            "type": "_id_12",
            "width": "*"
          },
          {
            "name": "DOCBASETYPE",
            "paramId": "8B738077BBF041E88B843AB9D98B12B0",
            "required": false,
            "title": "Document Category",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "expectedDifference",
            "paramId": "43F72D96CBDB467A900294090A3A03D7",
            "required": false,
            "title": "There is a difference of",
            "type": "_id_12",
            "width": "*"
          },
          {
            "name": "overpayment_action_display_logic",
            "paramId": "93DC15C203EB4205BDE0D87AFE185D5C",
            "required": false,
            "title": "Overpayment Action Display Logic",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "trxtype_display_logic",
            "paramId": "9E82150797C64125965C9BA668C2D2B4",
            "required": false,
            "title": "Document Display Logic",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "credit_to_use_display_logic",
            "paramId": "61059745E59240A998ED90DC83E5DA4F",
            "required": false,
            "title": "Credit to Use Display Logic",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "payment_documentno_readonly_logic",
            "paramId": "91BE9BC9D1FE44C2A4CD631AE2474EAD",
            "required": false,
            "title": "Payment DocumentNo Read Only Logic",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "payment_method_readonly_logic",
            "paramId": "075F4BA7A03F4548A7A501BAFD073DEE",
            "required": false,
            "title": "Payment Method Read Only Logic",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "actual_payment_readonly_logic",
            "paramId": "967CEF7421094B06B089DEA1D1F6C37D",
            "required": false,
            "title": "Actual Payment Read Only Logic",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "converted_amount_readonly_logic",
            "paramId": "B86607BED54F45B89718C80C61878093",
            "required": false,
            "title": "Converted Amount Read Only Logic",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "payment_date_readonly_logic",
            "paramId": "155F39F5EB144A648F409C115D61A489",
            "required": false,
            "title": "Payment Date Read Only Logic",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "fin_financial_account_id_readonly_logic",
            "paramId": "871DE320B33C4B83BDB4894EE99536E5",
            "required": false,
            "title": "Deposit To Read Only Logic",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "conversion_rate_readonly_logic",
            "paramId": "4CDE749FE6D341B4BCC128ADDAEE6068",
            "required": false,
            "title": "Conversion Rate Read Only Logic",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "received_from_readonly_logic",
            "paramId": "F1D97E6ABE584F209CFCEEF4C6FE4A3E",
            "required": false,
            "title": "Received From Read Only Logic",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "c_currency_id_readonly_logic",
            "paramId": "B8ECE87414564F1D8B974572A458E98A",
            "required": false,
            "title": "Currency Read Only Logic",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "ad_org_id_display_logic",
            "paramId": "0B13DC2C52424F36BDAFC790A0AB5886",
            "required": false,
            "title": "Organization Display Logic",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "bslamount_display_logic",
            "paramId": "DF292864DA82439793FB760E6D5A1FCC",
            "required": false,
            "title": "Bank Statement Line Amount Display Logic",
            "type": "_id_10",
            "width": "*"
          }
        ]
      }
    },
    {
      "actionHandler": "org.openbravo.common.actionhandler.ConfirmCancelAndReplaceSalesOrder",
      "dynamicColumns": {},
      "popup": true,
      "processId": "0C2AFAEFB67B4CB8A1429195EB119A49",
      "viewProperties": {
        "fields": []
      }
    },
    {
      "actionHandler": "org.openbravo.common.actionhandler.ManageReservationActionHandler",
      "dynamicColumns": {},
      "popup": true,
      "processId": "5F547560D3DE401AA0B570F22E2C6C06",
      "viewProperties": {
        "fields": [
          {
            "displayedRowsNumber": 5,
            "name": "grid",
            "paramId": "9CECCCE5B5664F5D9EEA37A573BC4D77",
            "required": false,
            "showTitle": false,
            "title": "Manage Stock",
            "type": "OBPickEditGridItem",
            "viewProperties": {
              "dataSourceProperties": {
                "createClassName": "OBPickAndExecuteDataSource",
                "dataURL": "/etendo/org.openbravo.service.datasource/2F5B70D7F12E4F5C8FE20D6F17D69ECF",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "active",
                    "type": "_id_20"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "obSelected",
                    "type": "_id_20"
                  },
                  {
                    "name": "reservationStock",
                    "type": "_id_70608617261A474EBAD0E8D56345FC68"
                  },
                  {
                    "name": "reservationStock$_identifier"
                  },
                  {
                    "name": "warehouse",
                    "type": "_id_30"
                  },
                  {
                    "name": "warehouse$_identifier"
                  },
                  {
                    "name": "storageBin",
                    "type": "_id_31"
                  },
                  {
                    "name": "storageBin$_identifier"
                  },
                  {
                    "name": "attributeSetValue",
                    "type": "_id_35"
                  },
                  {
                    "name": "attributeSetValue$_identifier"
                  },
                  {
                    "name": "purchaseOrderLine",
                    "type": "_id_30"
                  },
                  {
                    "name": "purchaseOrderLine$_identifier"
                  },
                  {
                    "name": "availableQty",
                    "type": "_id_29"
                  },
                  {
                    "name": "reservedinothers",
                    "type": "_id_29"
                  },
                  {
                    "name": "quantity",
                    "type": "_id_29"
                  },
                  {
                    "name": "released",
                    "type": "_id_29"
                  },
                  {
                    "name": "allocated",
                    "type": "_id_20"
                  },
                  {
                    "name": "salesOrderLine",
                    "type": "_id_2F18FEBF939D4F6DA5D5AEED73AE11D0"
                  },
                  {
                    "name": "salesOrderLine$_identifier"
                  },
                  {
                    "name": "stockReservation",
                    "type": "_id_746C95F41182419C921254B6CB4D8F8A"
                  },
                  {
                    "name": "stockReservation$_identifier"
                  },
                  {
                    "name": "reservationQuantity",
                    "type": "_id_29"
                  },
                  {
                    "name": "inventoryStatus",
                    "type": "_id_19"
                  },
                  {
                    "name": "inventoryStatus$_identifier"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_className": "OBPickAndExecuteDataSource",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier"
                  }
                }
              },
              "entity": "M_StockReservationPEDataSource",
              "fields": [
                {
                  "columnName": "OB_Selected",
                  "gridProps": {
                    "autoFitWidth": false,
                    "canFilter": true,
                    "canGroupBy": false,
                    "canSort": true,
                    "editorProps": {
                      "showLabel": false,
                      "showTitle": false
                    },
                    "selectOnClick": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 1,
                    "width": "*",
                    "yesNo": true
                  },
                  "id": "C9716CAD12E842D1BE87230518FE3A01",
                  "inpColumnName": "inpobSelected",
                  "name": "obSelected",
                  "overflow": "visible",
                  "title": "c_ob_selected",
                  "type": "_id_20",
                  "width": 1
                },
                {
                  "columnName": "M_Warehouse_ID",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 2
                  },
                  "id": "BA596A1FCFE24F99B32BA2F19F453AAD",
                  "inpColumnName": "inpmWarehouseId",
                  "name": "warehouse",
                  "refColumnName": "M_Warehouse_ID",
                  "targetEntity": "Warehouse",
                  "title": "Warehouse",
                  "type": "_id_30"
                },
                {
                  "columnName": "M_Locator_ID",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 3
                  },
                  "id": "B74729322D0B4B56A356E0196DB589C9",
                  "inFields": [
                    {
                      "columnName": "inpmWarehouseId",
                      "parameterName": "inpmWarehouseId"
                    },
                    {
                      "columnName": "inpadOrgId",
                      "parameterName": "inpAD_Org_ID"
                    }
                  ],
                  "inpColumnName": "inpmLocatorId",
                  "name": "storageBin",
                  "outFields": [],
                  "refColumnName": "M_Locator_ID",
                  "searchUrl": "/info/Locator.html",
                  "targetEntity": "Locator",
                  "title": "Storage Bin",
                  "type": "_id_31"
                },
                {
                  "columnName": "M_Attributesetinstance_ID",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 4
                  },
                  "id": "B8DD1D8D0490438C90865CE48A4A5C69",
                  "inpColumnName": "inpmAttributesetinstanceId",
                  "name": "attributeSetValue",
                  "refColumnName": "M_AttributeSetInstance_ID",
                  "targetEntity": "AttributeSetInstance",
                  "title": "Attribute Set Value",
                  "type": "_id_35"
                },
                {
                  "columnName": "C_Orderline_ID",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 5
                  },
                  "id": "776D1F4FE64F42CF9C4D81A2E1060C31",
                  "inpColumnName": "inpcOrderlineId",
                  "name": "purchaseOrderLine",
                  "refColumnName": "C_OrderLine_ID",
                  "targetEntity": "OrderLine",
                  "title": "Purchase Order Line",
                  "type": "_id_30"
                },
                {
                  "columnName": "Availableqty",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 6
                  },
                  "id": "B727DFE94FFB44DBA7E83A5CC110FE56",
                  "inpColumnName": "inpavailableqty",
                  "name": "availableQty",
                  "title": "Available Qty",
                  "type": "_id_29"
                },
                {
                  "columnName": "Reservedinothers",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 7
                  },
                  "id": "D7C82000170D43D18F1920A8E96D1949",
                  "inpColumnName": "inpreservedinothers",
                  "name": "reservedinothers",
                  "title": "Reserved In Others",
                  "type": "_id_29"
                },
                {
                  "columnName": "Quantity",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 8
                  },
                  "id": "F78B253B664E4CB3B0E47A6E4E134201",
                  "inpColumnName": "inpquantity",
                  "name": "quantity",
                  "title": "Quantity",
                  "type": "_id_29",
                  "validationFn": "OB.Reservation.QuantityValidate"
                },
                {
                  "columnName": "Releasedqty",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 9
                  },
                  "id": "052E2B6A5FB444A0A8FFA12A7F5AE7D2",
                  "inpColumnName": "inpreleasedqty",
                  "name": "released",
                  "title": "Released",
                  "type": "_id_29"
                },
                {
                  "columnName": "Isallocated",
                  "gridProps": {
                    "autoFitWidth": false,
                    "canFilter": true,
                    "canGroupBy": false,
                    "canSort": true,
                    "editorProps": {
                      "showLabel": false,
                      "showTitle": false
                    },
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 10,
                    "width": "*",
                    "yesNo": true
                  },
                  "id": "D165311612564E8CAC703D261108CD0B",
                  "inpColumnName": "inpisallocated",
                  "name": "allocated",
                  "overflow": "visible",
                  "title": "Allocated",
                  "type": "_id_20",
                  "width": 1
                },
                {
                  "columnName": "M_InventoryStatus_ID",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 0,
                    "editorProps": {
                      "displayField": "_identifier",
                      "valueField": "id"
                    },
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 11
                  },
                  "id": "D90E4D779541418CADFAE915D0EBDCA1",
                  "inpColumnName": "inpmInventorystatusId",
                  "name": "inventoryStatus",
                  "refColumnName": "M_Inventorystatus_ID",
                  "targetEntity": "MaterialMgmtInventoryStatus",
                  "title": "Inventory Status",
                  "type": "_id_19"
                },
                {
                  "defaultValue": "Audit",
                  "itemIds": [
                    "creationDate",
                    "createdBy",
                    "updated",
                    "updatedBy"
                  ],
                  "name": "1000100001",
                  "personalizable": false,
                  "title": "Audit",
                  "type": "OBAuditSectionItem"
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "creationDate",
                  "personalizable": false,
                  "title": "Creation Date",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "createdBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "createdBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Created By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updated",
                  "personalizable": false,
                  "title": "Updated",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "updatedBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updatedBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Updated By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "name": "_notes_",
                  "personalizable": false,
                  "type": "OBNoteSectionItem"
                },
                {
                  "name": "_notes_Canvas",
                  "personalizable": false,
                  "type": "OBNoteCanvasItem"
                },
                {
                  "name": "_linkedItems_",
                  "personalizable": false,
                  "type": "OBLinkedItemSectionItem"
                },
                {
                  "name": "_linkedItems_Canvas",
                  "personalizable": false,
                  "type": "OBLinkedItemCanvasItem"
                },
                {
                  "name": "_attachments_",
                  "personalizable": false,
                  "type": "OBAttachmentsSectionItem"
                },
                {
                  "name": "_attachments_Canvas",
                  "personalizable": false,
                  "type": "OBAttachmentCanvasItem"
                }
              ],
              "gridProperties": {
                "alias": "e",
                "allowSummaryFunctions": false,
                "filterClause": false,
                "sortField": "storageBin"
              },
              "mapping250": "/ReservationPickandEdit/Reservation",
              "moduleId": "0",
              "selectionType": "M",
              "showSelect": true,
              "standardProperties": {
                "inpTabId": "DAA5BFA2BF2B475E9BFEFF9CF721F09A",
                "inpTableId": "7BDAC914CA60418795E453BC0E8C89DC",
                "inpwindowId": "442FA34D72E5423B8DDBD65DBF0ED4B6"
              },
              "statusBarFields": [],
              "tabId": "DAA5BFA2BF2B475E9BFEFF9CF721F09A",
              "tabTitle": "Reservation"
            },
            "width": "*"
          }
        ]
      }
    },
    {
      "actionHandler": "org.openbravo.common.actionhandler.ServiceOrderLineRelate",
      "dynamicColumns": {},
      "onLoadFunction": "OB.ProductServices.onLoad",
      "popup": true,
      "processId": "C4265E27C8134096B49DFBF69369DFC6",
      "viewProperties": {
        "fields": [
          {
            "displayedRowsNumber": 20,
            "name": "grid",
            "onGridLoadFunction": "OB.ProductServices.onLoadGrid",
            "paramId": "49BD36D0E5BE450989B2D2C08ABD1648",
            "required": false,
            "showTitle": false,
            "title": "Pick/Edit Lines",
            "type": "OBPickEditGridItem",
            "viewProperties": {
              "dataSourceProperties": {
                "createClassName": "OBPickAndExecuteDataSource",
                "dataURL": "/etendo/org.openbravo.service.datasource/3C1148C0AB604DE1B51B7EA4112C325F",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "salesOrder",
                    "type": "_id_30"
                  },
                  {
                    "name": "salesOrder$_identifier"
                  },
                  {
                    "name": "documentNo",
                    "type": "_id_10"
                  },
                  {
                    "name": "orderDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "lineNo",
                    "type": "_id_11"
                  },
                  {
                    "name": "product",
                    "type": "_id_18"
                  },
                  {
                    "name": "product$_identifier"
                  },
                  {
                    "name": "attributeSetValue",
                    "type": "_id_35"
                  },
                  {
                    "name": "attributeSetValue$_identifier"
                  },
                  {
                    "name": "amount",
                    "type": "_id_12"
                  },
                  {
                    "name": "discountsAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "unitDiscountsAmt",
                    "type": "_id_12"
                  },
                  {
                    "name": "relatedQuantity",
                    "type": "_id_29"
                  },
                  {
                    "name": "originalOrderedQuantity",
                    "type": "_id_29"
                  },
                  {
                    "name": "price",
                    "type": "_id_12"
                  },
                  {
                    "name": "returnQtyOtherRM",
                    "type": "_id_29"
                  },
                  {
                    "name": "obSelected",
                    "type": "_id_20"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_className": "OBPickAndExecuteDataSource",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier",
                    "tableId": "213FE8C4AC5E4C95AFC09C80D5C3B663"
                  }
                }
              },
              "entity": "c_orderlinepickedit",
              "fields": [
                {
                  "columnName": "documentNo",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 30,
                    "length": 30,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 1
                  },
                  "id": "99287D657B9940F49B5B4D02F76FECD9",
                  "inpColumnName": "inpdocumentno",
                  "length": 30,
                  "name": "documentNo",
                  "title": "Document No.",
                  "type": "_id_10"
                },
                {
                  "columnName": "orderDate",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 2
                  },
                  "id": "CC9247F2260E451C9B995B94B1F1697C",
                  "inpColumnName": "inporderdate",
                  "length": 12,
                  "name": "orderDate",
                  "title": "Order Date",
                  "type": "_id_15"
                },
                {
                  "columnName": "lineNo",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 3
                  },
                  "id": "6DAF4054AE9D468BA166751D695AE391",
                  "inpColumnName": "inplineno",
                  "name": "lineNo",
                  "title": "Line No.",
                  "type": "_id_11"
                },
                {
                  "columnName": "product",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "displayProperty": "name",
                    "editorProps": {
                      "displayField": "_identifier",
                      "valueField": "id"
                    },
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 4
                  },
                  "id": "9FCA2AB8830645E7A8BD5481B3CE4CF3",
                  "inpColumnName": "inpproduct",
                  "name": "product",
                  "refColumnName": "M_Product_ID",
                  "targetEntity": "Product",
                  "title": "Product",
                  "type": "_id_1F603F334B704F53928B8DB908611657"
                },
                {
                  "columnName": "attributeSetValue",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 22,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 5
                  },
                  "id": "79D27EFDF0654699A4E5BFB7840E1106",
                  "inpColumnName": "inpattributesetvalue",
                  "name": "attributeSetValue",
                  "refColumnName": "M_AttributeSetInstance_ID",
                  "targetEntity": "AttributeSetInstance",
                  "title": "Attribute Set Value",
                  "type": "_id_35"
                },
                {
                  "columnName": "amount",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 6
                  },
                  "id": "24F27A921DB84F49AF40F2799A849CEC",
                  "inpColumnName": "inpamount",
                  "name": "amount",
                  "title": "Amount",
                  "type": "_id_12"
                },
                {
                  "columnName": "price",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 7
                  },
                  "id": "989618F384FA49FF85538C97C213618C",
                  "inpColumnName": "inpprice",
                  "name": "price",
                  "title": "Unit Price",
                  "type": "_id_12"
                },
                {
                  "columnName": "discountsAmt",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 8
                  },
                  "id": "98C6CF9408CA4769AB75105F95D5A62B",
                  "inpColumnName": "inpdiscountsamt",
                  "name": "discountsAmount",
                  "title": "Discount Amount",
                  "type": "_id_12"
                },
                {
                  "columnName": "unitDiscountsAmt",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 9
                  },
                  "id": "4BCDE4702C724223BF9E8243BA1898B0",
                  "inpColumnName": "inpunitdiscountsamt",
                  "name": "unitDiscountsAmt",
                  "title": "Unit Discount Amt",
                  "type": "_id_12"
                },
                {
                  "columnName": "originalOrderedQuantity",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 10
                  },
                  "id": "6BC7A2285A33422B83F3E3DE714B7158",
                  "inpColumnName": "inporiginalorderedquantity",
                  "name": "originalOrderedQuantity",
                  "title": "Ordered Quantity",
                  "type": "_id_29"
                },
                {
                  "columnName": "relatedQuantity",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 11
                  },
                  "id": "025D94512BBC49E3A941AB7114C5704E",
                  "inpColumnName": "inprelatedquantity",
                  "name": "relatedQuantity",
                  "onChangeFunction": "OB.ProductServices.orderLinesGridQtyOnChange",
                  "title": "Related Quantity",
                  "type": "_id_29",
                  "validationFn": "OB.ProductServices.QuantityValidate"
                },
                {
                  "columnName": "returnQtyOtherRM",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 12
                  },
                  "id": "46E9D8CF5F344FE288E032A156B093FC",
                  "inpColumnName": "inpreturnqtyotherrm",
                  "name": "returnQtyOtherRM",
                  "title": "Returned Qty other RM",
                  "type": "_id_29"
                },
                {
                  "defaultValue": "Audit",
                  "itemIds": [
                    "creationDate",
                    "createdBy",
                    "updated",
                    "updatedBy"
                  ],
                  "name": "1000100001",
                  "personalizable": false,
                  "title": "Audit",
                  "type": "OBAuditSectionItem"
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "creationDate",
                  "personalizable": false,
                  "title": "Creation Date",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "createdBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "createdBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Created By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updated",
                  "personalizable": false,
                  "title": "Updated",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "updatedBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updatedBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Updated By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "name": "_notes_",
                  "personalizable": false,
                  "type": "OBNoteSectionItem"
                },
                {
                  "name": "_notes_Canvas",
                  "personalizable": false,
                  "type": "OBNoteCanvasItem"
                },
                {
                  "name": "_linkedItems_",
                  "personalizable": false,
                  "type": "OBLinkedItemSectionItem"
                },
                {
                  "name": "_linkedItems_Canvas",
                  "personalizable": false,
                  "type": "OBLinkedItemCanvasItem"
                },
                {
                  "name": "_attachments_",
                  "personalizable": false,
                  "type": "OBAttachmentsSectionItem"
                },
                {
                  "name": "_attachments_Canvas",
                  "personalizable": false,
                  "type": "OBAttachmentCanvasItem"
                }
              ],
              "gridProperties": {
                "alias": "e",
                "allowSummaryFunctions": false,
                "filterClause": true,
                "filterName": "This grid is filtered using an implicit filter.",
                "orderByClause": "o.documentNo desc, e.lineNo, e.product"
              },
              "mapping250": "/ServiceOrderLinePickandEdit/OrderLines",
              "moduleId": "0",
              "selectionType": "M",
              "showSelect": true,
              "standardProperties": {
                "inpkeyColumnId": "50604B83F88B4B5CBCCDBA37B847F81E",
                "inpKeyName": "inpid",
                "inpTabId": "52B21E690E024445A9F3B9F0A880AE8F",
                "inpTableId": "213FE8C4AC5E4C95AFC09C80D5C3B663",
                "inpwindowId": "8F104213DDF44D62B75D133C956F74CF",
                "keyColumnName": "id",
                "keyProperty": "id",
                "keyPropertyType": "_id_13"
              },
              "statusBarFields": [],
              "tabId": "52B21E690E024445A9F3B9F0A880AE8F",
              "tabTitle": "Order Lines"
            },
            "width": "*"
          },
          {
            "defaultValue": "Totals",
            "itemIds": [
              "totallinesamount",
              "totaldiscountsamount",
              "totalserviceamount",
              "orderlineId",
              "pricePrecision",
              "totapriceamount",
              "totalrelatedqty",
              "totalUnitDiscountsAmt"
            ],
            "name": "BFFF70E721654110AD5BACF3D4216D3A",
            "sectionExpanded": true,
            "title": "Totals",
            "type": "OBSectionItem"
          },
          {
            "length": 12,
            "name": "totallinesamount",
            "paramId": "DAE78C4FC90D4E40AA2DB068CE21343D",
            "required": false,
            "title": "Summed Line Amount",
            "type": "_id_12",
            "width": "*"
          },
          {
            "length": 12,
            "name": "totaldiscountsamount",
            "paramId": "A0B4C08B57D04D38B67035E4C8FE0EE4",
            "required": false,
            "title": "Summed Discounts Amount",
            "type": "_id_12",
            "width": "*"
          },
          {
            "length": 12,
            "name": "totalserviceamount",
            "paramId": "5D83F5C9E3BE46B2A91E7923070D08A8",
            "required": false,
            "title": "Summed Service Amount",
            "type": "_id_12",
            "width": "*"
          },
          {
            "name": "orderlineId",
            "paramId": "3DA90EDE17724374A90089F096D59949",
            "required": false,
            "title": "serviceProductId",
            "type": "_id_10",
            "width": "*"
          },
          {
            "name": "pricePrecision",
            "paramId": "809C84E245374F07BF027DD68054CE80",
            "required": false,
            "title": "Price Precision",
            "type": "_id_22",
            "width": "*"
          },
          {
            "length": 12,
            "name": "totapriceamount",
            "paramId": "01CC9F4F04164E2CB457EBEBFD7E0669",
            "required": false,
            "title": "Summed Price Amount",
            "type": "_id_800008",
            "width": "*"
          },
          {
            "length": 12,
            "name": "totalrelatedqty",
            "paramId": "83F3D8041AE8417EB3AA2AD3311A6AFE",
            "required": false,
            "title": "Summed Related Qty",
            "type": "_id_29",
            "width": "*"
          },
          {
            "length": 12,
            "name": "totalUnitDiscountsAmt",
            "paramId": "D52FFF3968BA4B26B0E62A9E4C8DFDC1",
            "required": false,
            "title": "Summed Unit Discounts Amount",
            "type": "_id_12",
            "width": "*"
          }
        ]
      }
    }
  ],
  "window": {
    "multiDocumentEnabled": false,
    "viewProperties": {
      "actionToolbarButtons": [
        {
          "autosave": true,
          "command": "org.openbravo.advpaymentmngt.actionHandler.AddPaymentActionHandler",
          "id": "04CFE3A53162449380A253DE0B814AEF",
          "modal": false,
          "multiRecord": true,
          "newDefinition": true,
          "obManualURL": "/",
          "processId": "9BED7889E1034FE68BD85D5D16857320",
          "property": "aPRMAddPayment",
          "title": "Add Payment",
          "uiPattern": "A",
          "windowId": "143"
        },
        {
          "autosave": true,
          "command": "com.smf.jobs.defaults.ProcessOrders",
          "id": "1083",
          "labelValue": {
            "--": "<None>",
            "AP": "Approve",
            "CL": "Close",
            "CO": "Book",
            "PO": "Post",
            "PR": "Process",
            "RA": "Reverse - Accrual",
            "RC": "Void",
            "RE": "Reactivate",
            "RJ": "Reject",
            "TR": "Transfer",
            "VO": "Void",
            "XL": "Unlock"
          },
          "modal": false,
          "multiRecord": true,
          "newDefinition": true,
          "obManualURL": "/",
          "processId": "8DF818E471394C01A6546A4AB7F5E529",
          "property": "documentAction",
          "title": "Process Order",
          "uiPattern": "A",
          "windowId": "143"
        },
        {
          "autosave": true,
          "command": "DEFAULT",
          "id": "6560",
          "obManualURL": "/ad_actionButton/CopyFromOrder.html",
          "processId": "211",
          "property": "copyFrom",
          "title": "Copy Lines"
        },
        {
          "autosave": true,
          "command": "org.openbravo.common.actionhandler.CopyFromOrdersActionHandler",
          "id": "804079",
          "modal": false,
          "multiRecord": false,
          "newDefinition": true,
          "obManualURL": "/",
          "processId": "8B81D80B06364566B87853FEECAB5DE0",
          "property": "copyFromPO",
          "title": "Copy from Orders",
          "uiPattern": "OBUIAPP_PickAndExecute",
          "windowId": "143"
        },
        {
          "autosave": true,
          "command": "org.openbravo.common.actionhandler.CancelAndReplaceSalesOrder",
          "id": "3C9B97CD980A4D809BDE5B9FDC3E0E73",
          "modal": false,
          "multiRecord": false,
          "newDefinition": true,
          "obManualURL": "/",
          "processId": "A2FAF49712D1445ABE750315CE1B473A",
          "property": "cancelandreplace",
          "title": "Cancel and Replace",
          "uiPattern": "OBUIAPP_PickAndExecute",
          "windowId": "143"
        },
        {
          "autosave": true,
          "command": "org.openbravo.common.actionhandler.ConfirmCancelAndReplaceSalesOrder",
          "id": "F0BF2E4561024D30B93AC7B471DBF5D7",
          "modal": false,
          "multiRecord": false,
          "newDefinition": true,
          "obManualURL": "/",
          "processId": "0C2AFAEFB67B4CB8A1429195EB119A49",
          "property": "confirmcancelandreplace",
          "title": "Confirm Cancel and Replace",
          "uiPattern": "OBUIAPP_PickAndExecute",
          "windowId": "143"
        }
      ],
      "askToCloneChildren": false,
      "buttonsHaveSessionLogic": true,
      "createViewStructure": [
        {
          "actionToolbarButtons": [
            {
              "autosave": true,
              "command": "org.openbravo.common.actionhandler.ManageReservationActionHandler",
              "id": "CE626BBC5EB58638E040007F01001502",
              "modal": false,
              "multiRecord": false,
              "newDefinition": true,
              "obManualURL": "/",
              "processId": "5F547560D3DE401AA0B570F22E2C6C06",
              "property": "manageReservation",
              "title": "Manage Reservation",
              "uiPattern": "OBUIAPP_PickAndExecute",
              "windowId": "143"
            },
            {
              "autosave": true,
              "command": "BUTTONExplodeDFC78024B1F54CBB95DC73425BA6687F",
              "id": "8CF90D88C5F445C59FF111C9FCEBF413",
              "obManualURL": "/SalesOrder/Lines_Edition.html",
              "processId": "DFC78024B1F54CBB95DC73425BA6687F",
              "property": "explode",
              "title": "Explode"
            },
            {
              "autosave": true,
              "command": "org.openbravo.common.actionhandler.ServiceOrderLineRelate",
              "id": "FD42EB7017AA42009DF8E7EE9ECBA325",
              "modal": false,
              "multiRecord": false,
              "newDefinition": true,
              "obManualURL": "/",
              "processId": "C4265E27C8134096B49DFBF69369DFC6",
              "property": "selectOrderLine",
              "title": "Select Order Line",
              "uiPattern": "OBUIAPP_PickAndExecute",
              "windowId": "143"
            }
          ],
          "askToCloneChildren": true,
          "buttonsHaveSessionLogic": true,
          "createViewStructure": [
            {
              "actionToolbarButtons": [],
              "askToCloneChildren": true,
              "buttonsHaveSessionLogic": false,
              "dataSource": {
                "createClassName": "OBViewDataSource",
                "dataURL": "/etendo/org.openbravo.service.datasource/OrderLineTax",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "salesOrderLine",
                    "type": "_id_30"
                  },
                  {
                    "name": "salesOrderLine$_identifier"
                  },
                  {
                    "name": "tax",
                    "type": "_id_19"
                  },
                  {
                    "name": "tax$_identifier"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "active",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  },
                  {
                    "name": "taxableAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "taxAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "lineNo",
                    "type": "_id_11"
                  },
                  {
                    "name": "salesOrder",
                    "type": "_id_19"
                  },
                  {
                    "name": "salesOrder$_identifier"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_className": "OBViewDataSource",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier"
                  }
                }
              },
              "entity": "OrderLineTax",
              "fields": [
                {
                  "columnName": "Line",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 1
                  },
                  "hasDefaultValue": true,
                  "id": "7E5649D8625C0D79E040007F01001E28",
                  "inpColumnName": "inpline",
                  "name": "lineNo",
                  "title": "Line No.",
                  "type": "_id_11"
                },
                {
                  "columnName": "C_Tax_ID",
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "editorProps": {
                      "displayField": "_identifier",
                      "valueField": "id"
                    },
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 2
                  },
                  "id": "7E5649D8625A0D79E040007F01001E28",
                  "inpColumnName": "inpcTaxId",
                  "name": "tax",
                  "refColumnName": "C_Tax_ID",
                  "required": true,
                  "targetEntity": "FinancialMgmtTaxRate",
                  "title": "Tax",
                  "type": "_id_19"
                },
                {
                  "columnName": "Taxbaseamt",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 3
                  },
                  "hasDefaultValue": true,
                  "id": "7E5649D8625E0D79E040007F01001E28",
                  "inpColumnName": "inptaxbaseamt",
                  "name": "taxableAmount",
                  "required": true,
                  "title": "Taxable Amount",
                  "type": "_id_12"
                },
                {
                  "columnName": "Taxamt",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 4
                  },
                  "hasDefaultValue": true,
                  "id": "7E5649D8625D0D79E040007F01001E28",
                  "inpColumnName": "inptaxamt",
                  "name": "taxAmount",
                  "required": true,
                  "title": "Tax Amount",
                  "type": "_id_12"
                },
                {
                  "defaultValue": "Audit",
                  "itemIds": [
                    "creationDate",
                    "createdBy",
                    "updated",
                    "updatedBy"
                  ],
                  "name": "1000100001",
                  "personalizable": false,
                  "title": "Audit",
                  "type": "OBAuditSectionItem"
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "creationDate",
                  "personalizable": false,
                  "title": "Creation Date",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "createdBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "createdBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Created By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updated",
                  "personalizable": false,
                  "title": "Updated",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "updatedBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updatedBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Updated By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "name": "_notes_",
                  "personalizable": false,
                  "type": "OBNoteSectionItem"
                },
                {
                  "name": "_notes_Canvas",
                  "personalizable": false,
                  "type": "OBNoteCanvasItem"
                },
                {
                  "name": "_linkedItems_",
                  "personalizable": false,
                  "type": "OBLinkedItemSectionItem"
                },
                {
                  "name": "_linkedItems_Canvas",
                  "personalizable": false,
                  "type": "OBLinkedItemCanvasItem"
                },
                {
                  "name": "_attachments_",
                  "personalizable": false,
                  "type": "OBAttachmentsSectionItem"
                },
                {
                  "name": "_attachments_Canvas",
                  "personalizable": false,
                  "type": "OBAttachmentCanvasItem"
                }
              ],
              "iconToolbarButtons": [],
              "initialPropertyToColumns": [
                {
                  "dbColumn": "AD_Client_ID",
                  "inpColumn": "inpadClientId",
                  "property": "client",
                  "sessionProperty": true,
                  "type": "_id_19"
                },
                {
                  "dbColumn": "AD_Org_ID",
                  "inpColumn": "inpadOrgId",
                  "property": "organization",
                  "sessionProperty": true,
                  "type": "_id_19"
                },
                {
                  "dbColumn": "C_Orderline_ID",
                  "inpColumn": "inpcOrderlineId",
                  "property": "salesOrderLine",
                  "type": "_id_30"
                },
                {
                  "dbColumn": "C_Orderlinetax_ID",
                  "inpColumn": "inpcOrderlinetaxId",
                  "property": "id",
                  "type": "_id_13"
                },
                {
                  "dbColumn": "Isactive",
                  "inpColumn": "inpisactive",
                  "property": "active",
                  "type": "_id_20"
                },
                {
                  "dbColumn": "C_Orderlinetax_ID",
                  "inpColumn": "C_Orderlinetax_ID",
                  "property": "id",
                  "sessionProperty": true,
                  "type": "_id_13"
                }
              ],
              "isDeleteableTable": true,
              "mapping250": "/SalesOrder/LineTax",
              "moduleId": "0",
              "notesDataSource": {
                "createClassName": "",
                "dataURL": "/etendo/org.openbravo.service.datasource/090A37D22E61FE94012E621729090048",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "table",
                    "type": "_id_19"
                  },
                  {
                    "name": "table$_identifier"
                  },
                  {
                    "name": "record",
                    "type": "_id_10"
                  },
                  {
                    "name": "note",
                    "type": "_id_14"
                  },
                  {
                    "name": "isactive",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  }
                ],
                "potentiallyShared": true,
                "requestProperties": {
                  "params": {
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier"
                  }
                }
              },
              "parentProperty": "salesOrderLine",
              "showCloneButton": false,
              "showParentButtons": true,
              "standardProperties": {
                "inpkeyColumnId": "C_Orderlinetax_ID",
                "inpKeyName": "inpcOrderlinetaxId",
                "inpTabId": "25C70617A7964B479BDA71197E7E88E9",
                "inpTableId": "E42DDB42FF0B4F82B1CF3C711B3F0DC0",
                "inpwindowId": "143",
                "keyColumnName": "C_Orderlinetax_ID",
                "keyProperty": "id",
                "keyPropertyType": "_id_13"
              },
              "statusBarFields": [],
              "tabId": "25C70617A7964B479BDA71197E7E88E9",
              "tabTitle": "Line Tax",
              "viewGrid": {
                "allowSummaryFunctions": true,
                "filterClause": false,
                "orderByClause": "lineNo",
                "requiredGridProperties": [
                  "id",
                  "client",
                  "organization",
                  "updatedBy",
                  "updated",
                  "creationDate",
                  "createdBy",
                  "salesOrderLine",
                  "tax",
                  "salesOrderLine",
                  "client",
                  "organization"
                ],
                "uiPattern": "RO"
              }
            },
            {
              "actionToolbarButtons": [],
              "askToCloneChildren": true,
              "buttonsHaveSessionLogic": false,
              "dataSource": {
                "createClassName": "OBViewDataSource",
                "dataURL": "/etendo/org.openbravo.service.datasource/SOLReservedStock",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "active",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  },
                  {
                    "name": "reservationStock",
                    "type": "_id_70608617261A474EBAD0E8D56345FC68"
                  },
                  {
                    "name": "reservationStock$_identifier"
                  },
                  {
                    "name": "stockReservation",
                    "type": "_id_746C95F41182419C921254B6CB4D8F8A"
                  },
                  {
                    "name": "stockReservation$_identifier"
                  },
                  {
                    "name": "salesOrderLine",
                    "type": "_id_A253A91D78324DC4A1661E96B390D888"
                  },
                  {
                    "name": "salesOrderLine$_identifier"
                  },
                  {
                    "additional": true,
                    "name": "reservationStock$storageBin",
                    "type": "_id_31"
                  },
                  {
                    "name": "reservationStock$storageBin$_identifier"
                  },
                  {
                    "additional": true,
                    "name": "reservationStock$attributeSetValue",
                    "type": "_id_35"
                  },
                  {
                    "name": "reservationStock$attributeSetValue$_identifier"
                  },
                  {
                    "additional": true,
                    "name": "reservationStock$salesOrderLine",
                    "type": "_id_30"
                  },
                  {
                    "name": "reservationStock$salesOrderLine$_identifier"
                  },
                  {
                    "additional": true,
                    "name": "reservationStock$salesOrderLine$businessPartner",
                    "type": "_id_800057"
                  },
                  {
                    "name": "reservationStock$salesOrderLine$businessPartner$_identifier"
                  },
                  {
                    "additional": true,
                    "name": "reservationStock$quantity",
                    "type": "_id_29"
                  },
                  {
                    "additional": true,
                    "name": "reservationStock$released",
                    "type": "_id_29"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_className": "OBViewDataSource",
                    "_extraProperties": "reservationStock.storageBin,reservationStock.attributeSetValue,reservationStock.salesOrderLine,reservationStock.salesOrderLine.businessPartner,reservationStock.quantity,reservationStock.released",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier"
                  }
                }
              },
              "entity": "SOLReservedStock",
              "fields": [
                {
                  "columnName": "M_Reservation_ID",
                  "defaultPopupFilterField": "_identifier",
                  "displayField": "_identifier",
                  "extraSearchFields": [],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 1
                  },
                  "id": "CEF17EDBFBC9D7E2E040007F01002238",
                  "inpColumnName": "inpmReservationId",
                  "name": "stockReservation",
                  "optionDataSource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/MaterialMgmtReservation",
                    "fields": [
                      {
                        "name": "id",
                        "primaryKey": true,
                        "type": "_id_13"
                      },
                      {
                        "name": "client",
                        "type": "_id_19"
                      },
                      {
                        "name": "client$_identifier"
                      },
                      {
                        "name": "organization",
                        "type": "_id_19"
                      },
                      {
                        "name": "organization$_identifier"
                      },
                      {
                        "name": "active",
                        "type": "_id_20"
                      },
                      {
                        "name": "creationDate",
                        "type": "_id_16"
                      },
                      {
                        "name": "createdBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "createdBy$_identifier"
                      },
                      {
                        "name": "updated",
                        "type": "_id_16"
                      },
                      {
                        "name": "updatedBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "updatedBy$_identifier"
                      },
                      {
                        "name": "product",
                        "type": "_id_800011"
                      },
                      {
                        "name": "product$_identifier"
                      },
                      {
                        "name": "quantity",
                        "type": "_id_29"
                      },
                      {
                        "name": "uOM",
                        "type": "_id_19"
                      },
                      {
                        "name": "uOM$_identifier"
                      },
                      {
                        "name": "salesOrderLine",
                        "type": "_id_30"
                      },
                      {
                        "name": "salesOrderLine$_identifier"
                      },
                      {
                        "name": "userContact",
                        "type": "_id_19"
                      },
                      {
                        "name": "userContact$_identifier"
                      },
                      {
                        "name": "businessPartner",
                        "type": "_id_800057"
                      },
                      {
                        "name": "businessPartner$_identifier"
                      },
                      {
                        "name": "warehouse",
                        "type": "_id_19"
                      },
                      {
                        "name": "warehouse$_identifier"
                      },
                      {
                        "name": "attributeSetValue",
                        "type": "_id_35"
                      },
                      {
                        "name": "attributeSetValue$_identifier"
                      },
                      {
                        "name": "storageBin",
                        "type": "_id_31"
                      },
                      {
                        "name": "storageBin$_identifier"
                      },
                      {
                        "name": "reservedQty",
                        "type": "_id_29"
                      },
                      {
                        "name": "released",
                        "type": "_id_29"
                      },
                      {
                        "name": "rESStatus",
                        "type": "_id_EE8B072E19034D0FB34CA1CEB3583620",
                        "valueMap": {
                          "CL": "Closed",
                          "CO": "Completed",
                          "DR": "Draft",
                          "HO": "Hold"
                        }
                      },
                      {
                        "name": "rESProcess",
                        "type": "_id_440DDA64A43F4799AAFF48BC86DC8F78",
                        "valueMap": {
                          "CL": "Close",
                          "HO": "Put on Hold",
                          "PR": "Process",
                          "RE": "Reactivate",
                          "UNHO": "Unhold"
                        }
                      },
                      {
                        "name": "manageStock",
                        "type": "_id_28"
                      },
                      {
                        "name": "reservedgoodmntPe",
                        "type": "_id_28"
                      },
                      {
                        "additional": true,
                        "name": "businessPartner$name",
                        "type": "_id_10"
                      }
                    ],
                    "requestProperties": {
                      "params": {
                        "adTabId": "38D83B9AB72D42F1BFED48911E49F6CD",
                        "columnName": "M_Reservation_ID",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "stockReservation"
                      }
                    }
                  },
                  "outFields": {},
                  "outHiddenInputPrefix": "inpmReservationId",
                  "pickListFields": [
                    {
                      "name": "_identifier",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "M_Reservation_ID",
                  "required": true,
                  "selectorDefinitionId": "D4F428CFB0FD42A6998BF377BA4212AB",
                  "selectorGridFields": [],
                  "showSelectorGrid": false,
                  "targetEntity": "MaterialMgmtReservation",
                  "textMatchStyle": "startsWith",
                  "title": "Stock Reservation",
                  "type": "_id_746C95F41182419C921254B6CB4D8F8A",
                  "valueField": "id"
                },
                {
                  "columnName": "_propertyField_storagebin_M_Locator_ID",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 2
                  },
                  "id": "1DF093BB951F4CAEA844FF08843CD8D8",
                  "inFields": [
                    {
                      "columnName": "inpmWarehouseId",
                      "parameterName": "inpmWarehouseId"
                    },
                    {
                      "columnName": "inpadOrgId",
                      "parameterName": "inpAD_Org_ID"
                    }
                  ],
                  "inpColumnName": "inp_propertyField_storagebin_M_Locator_ID",
                  "name": "reservationStock$storageBin",
                  "outFields": [],
                  "refColumnName": "M_Locator_ID",
                  "searchUrl": "/info/Locator.html",
                  "targetEntity": "Locator",
                  "title": "Storage Bin",
                  "type": "_id_31"
                },
                {
                  "columnName": "_propertyField_attributesetvalue_M_Attributesetinstance_ID",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 3
                  },
                  "id": "A8C62159988343A9A1A4CB90153C5D8B",
                  "inpColumnName": "inp_propertyField_attributesetvalue_M_Attributesetinstance_ID",
                  "name": "reservationStock$attributeSetValue",
                  "refColumnName": "M_AttributeSetInstance_ID",
                  "targetEntity": "AttributeSetInstance",
                  "title": "Attribute Set Value",
                  "type": "_id_35"
                },
                {
                  "columnName": "_propertyField_purchaseorderline_C_Orderline_ID",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 4
                  },
                  "id": "E28A115E25D44BB181D8D34CB55E0A1B",
                  "inpColumnName": "inp_propertyField_purchaseorderline_C_Orderline_ID",
                  "name": "reservationStock$salesOrderLine",
                  "refColumnName": "C_OrderLine_ID",
                  "targetEntity": "OrderLine",
                  "title": "Purchase Order Line",
                  "type": "_id_30"
                },
                {
                  "columnName": "_propertyField_vendor_C_BPartner_ID",
                  "defaultPopupFilterField": "name",
                  "disabled": true,
                  "displayField": "name",
                  "extraSearchFields": ["value"],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 5
                  },
                  "hasDefaultValue": true,
                  "id": "5F27F456BE1C41A186ABF8305E3752DF",
                  "inpColumnName": "inp_propertyField_vendor_C_BPartner_ID",
                  "name": "reservationStock$salesOrderLine$businessPartner",
                  "optionDataSource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/F8DD408F2F3A414188668836F84C21AF",
                    "fields": [],
                    "requestProperties": {
                      "params": {
                        "_extraProperties": "category,value,creditAvailable,creditUsed,name,customer,bpid,vendor",
                        "adTabId": "38D83B9AB72D42F1BFED48911E49F6CD",
                        "columnName": "C_BPartner_ID",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "businessPartner"
                      }
                    }
                  },
                  "outFields": {},
                  "outHiddenInputPrefix": "inpcBpartnerId",
                  "pickListFields": [
                    {
                      "name": "name",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "C_BPartner_ID",
                  "selectorDefinitionId": "862F54CB1B074513BD791C6789F4AA42",
                  "selectorGridFields": [
                    {
                      "name": "name",
                      "showHover": true,
                      "title": "Name",
                      "type": "_id_10"
                    },
                    {
                      "name": "value",
                      "showHover": true,
                      "title": "Value",
                      "type": "_id_10"
                    },
                    {
                      "filterOnKeypress": false,
                      "name": "creditAvailable",
                      "showHover": true,
                      "title": "Credit Line available",
                      "type": "_id_12"
                    },
                    {
                      "filterOnKeypress": false,
                      "name": "creditUsed",
                      "showHover": true,
                      "title": "Customer Balance",
                      "type": "_id_12"
                    },
                    {
                      "name": "customer",
                      "showHover": true,
                      "title": "Customer",
                      "type": "_id_20"
                    },
                    {
                      "name": "vendor",
                      "showHover": true,
                      "title": "Vendor",
                      "type": "_id_20"
                    },
                    {
                      "name": "category",
                      "showHover": true,
                      "title": "Category",
                      "type": "_id_10"
                    }
                  ],
                  "showSelectorGrid": true,
                  "targetEntity": "BusinessPartner",
                  "textMatchStyle": "substring",
                  "title": "Vendor",
                  "type": "_id_800057",
                  "valueField": "bpid"
                },
                {
                  "columnName": "_propertyField_quantity_Quantity",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 6
                  },
                  "id": "FF55A405367C423DA033A369C56945D1",
                  "inpColumnName": "inp_propertyField_quantity_Quantity",
                  "name": "reservationStock$quantity",
                  "title": "Quantity",
                  "type": "_id_29"
                },
                {
                  "columnName": "_propertyField_released_ReleasedQty",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 7
                  },
                  "id": "C7BAD3284E1340D78D81FA9F11295425",
                  "inpColumnName": "inp_propertyField_released_ReleasedQty",
                  "name": "reservationStock$released",
                  "title": "Released",
                  "type": "_id_29"
                },
                {
                  "defaultValue": "Audit",
                  "itemIds": [
                    "creationDate",
                    "createdBy",
                    "updated",
                    "updatedBy"
                  ],
                  "name": "1000100001",
                  "personalizable": false,
                  "title": "Audit",
                  "type": "OBAuditSectionItem"
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "creationDate",
                  "personalizable": false,
                  "title": "Creation Date",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "createdBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "createdBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Created By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updated",
                  "personalizable": false,
                  "title": "Updated",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "updatedBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updatedBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Updated By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "name": "_notes_",
                  "personalizable": false,
                  "type": "OBNoteSectionItem"
                },
                {
                  "name": "_notes_Canvas",
                  "personalizable": false,
                  "type": "OBNoteCanvasItem"
                },
                {
                  "name": "_linkedItems_",
                  "personalizable": false,
                  "type": "OBLinkedItemSectionItem"
                },
                {
                  "name": "_linkedItems_Canvas",
                  "personalizable": false,
                  "type": "OBLinkedItemCanvasItem"
                },
                {
                  "name": "_attachments_",
                  "personalizable": false,
                  "type": "OBAttachmentsSectionItem"
                },
                {
                  "name": "_attachments_Canvas",
                  "personalizable": false,
                  "type": "OBAttachmentCanvasItem"
                }
              ],
              "iconToolbarButtons": [],
              "initialPropertyToColumns": [
                {
                  "dbColumn": "M_Sol_Reserved_Stock_V_ID",
                  "inpColumn": "inpmSolReservedStockVId",
                  "property": "id",
                  "type": "_id_13"
                },
                {
                  "dbColumn": "AD_Client_ID",
                  "inpColumn": "inpadClientId",
                  "property": "client",
                  "sessionProperty": true,
                  "type": "_id_19"
                },
                {
                  "dbColumn": "AD_Org_ID",
                  "inpColumn": "inpadOrgId",
                  "property": "organization",
                  "sessionProperty": true,
                  "type": "_id_19"
                },
                {
                  "dbColumn": "Isactive",
                  "inpColumn": "inpisactive",
                  "property": "active",
                  "type": "_id_20"
                },
                {
                  "dbColumn": "M_Reservation_Stock_ID",
                  "inpColumn": "inpmReservationStockId",
                  "property": "reservationStock",
                  "type": "_id_70608617261A474EBAD0E8D56345FC68"
                },
                {
                  "dbColumn": "C_Orderline_ID",
                  "inpColumn": "inpcOrderlineId",
                  "property": "salesOrderLine",
                  "type": "_id_A253A91D78324DC4A1661E96B390D888"
                },
                {
                  "dbColumn": "M_Sol_Reserved_Stock_V_ID",
                  "inpColumn": "M_Sol_Reserved_Stock_V_ID",
                  "property": "id",
                  "sessionProperty": true,
                  "type": "_id_13"
                }
              ],
              "isDeleteableTable": true,
              "mapping250": "/SalesOrder/ReservedStock",
              "moduleId": "0",
              "notesDataSource": {
                "createClassName": "",
                "dataURL": "/etendo/org.openbravo.service.datasource/090A37D22E61FE94012E621729090048",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "table",
                    "type": "_id_19"
                  },
                  {
                    "name": "table$_identifier"
                  },
                  {
                    "name": "record",
                    "type": "_id_10"
                  },
                  {
                    "name": "note",
                    "type": "_id_14"
                  },
                  {
                    "name": "isactive",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  }
                ],
                "potentiallyShared": true,
                "requestProperties": {
                  "params": {
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier"
                  }
                }
              },
              "parentProperty": "salesOrderLine",
              "sessionAttributesNames": ["StockReservations"],
              "showCloneButton": false,
              "showParentButtons": true,
              "standardProperties": {
                "inpkeyColumnId": "M_Sol_Reserved_Stock_V_ID",
                "inpKeyName": "inpmSolReservedStockVId",
                "inpTabId": "38D83B9AB72D42F1BFED48911E49F6CD",
                "inpTableId": "8A36D18D1D164189B7C3AE892F310E11",
                "inpwindowId": "143",
                "keyColumnName": "M_Sol_Reserved_Stock_V_ID",
                "keyProperty": "id",
                "keyPropertyType": "_id_13"
              },
              "statusBarFields": [],
              "tabId": "38D83B9AB72D42F1BFED48911E49F6CD",
              "tabTitle": "Reserved Stock",
              "viewGrid": {
                "allowSummaryFunctions": true,
                "filterClause": false,
                "requiredGridProperties": [
                  "id",
                  "client",
                  "organization",
                  "updatedBy",
                  "updated",
                  "creationDate",
                  "createdBy",
                  "reservationStock",
                  "salesOrderLine",
                  "client",
                  "organization"
                ],
                "sortField": "quantity",
                "uiPattern": "RO"
              }
            },
            {
              "actionToolbarButtons": [],
              "askToCloneChildren": true,
              "buttonsHaveSessionLogic": false,
              "dataSource": {
                "createClassName": "OBViewDataSource",
                "dataURL": "/etendo/org.openbravo.service.datasource/OrderlineServiceRelation",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "active",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  },
                  {
                    "name": "salesOrderLine",
                    "type": "_id_2F18FEBF939D4F6DA5D5AEED73AE11D0"
                  },
                  {
                    "name": "salesOrderLine$_identifier"
                  },
                  {
                    "name": "orderlineRelated",
                    "type": "_id_2F18FEBF939D4F6DA5D5AEED73AE11D0"
                  },
                  {
                    "name": "orderlineRelated$_identifier"
                  },
                  {
                    "name": "amount",
                    "type": "_id_12"
                  },
                  {
                    "name": "quantity",
                    "type": "_id_22"
                  },
                  {
                    "additional": true,
                    "name": "orderlineRelated$salesOrder$documentNo",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "orderlineRelated$lineNo",
                    "type": "_id_11"
                  },
                  {
                    "additional": true,
                    "name": "orderlineRelated$product",
                    "type": "_id_800060"
                  },
                  {
                    "name": "orderlineRelated$product$_identifier"
                  },
                  {
                    "additional": true,
                    "name": "orderlineRelated$attributeSetValue",
                    "type": "_id_35"
                  },
                  {
                    "name": "orderlineRelated$attributeSetValue$_identifier"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_className": "OBViewDataSource",
                    "_extraProperties": "orderlineRelated.salesOrder.documentNo,orderlineRelated.lineNo,orderlineRelated.product,orderlineRelated.attributeSetValue",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier"
                  }
                }
              },
              "entity": "OrderlineServiceRelation",
              "fields": [
                {
                  "columnName": "_propertyField_documentno._DocumentNo",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 30,
                    "length": 30,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 1
                  },
                  "id": "6FF9502C5975479FB61FC9444B9FCEE6",
                  "inpColumnName": "inp_propertyField_documentno._DocumentNo",
                  "length": 30,
                  "name": "orderlineRelated$salesOrder$documentNo",
                  "title": "Document No.",
                  "type": "_id_10"
                },
                {
                  "columnName": "_propertyField_lineno._Line",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 2
                  },
                  "hasDefaultValue": true,
                  "id": "6E779E4B6DED48D397D31CFAF7EB8BB1",
                  "inpColumnName": "inp_propertyField_lineno._Line",
                  "name": "orderlineRelated$lineNo",
                  "startRow": true,
                  "title": "Line No.",
                  "type": "_id_11"
                },
                {
                  "columnName": "_propertyField_product_M_Product_ID",
                  "defaultPopupFilterField": "_identifier",
                  "disabled": true,
                  "displayField": "_identifier",
                  "extraSearchFields": [
                    "product$searchKey",
                    "product$name",
                    "product$_identifier"
                  ],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 3
                  },
                  "id": "54DB32FEEC9B4DED80CB488660F53506",
                  "inpColumnName": "inp_propertyField_product_M_Product_ID",
                  "name": "orderlineRelated$product",
                  "optionDataSource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/ProductByPriceAndWarehouse",
                    "fields": [
                      {
                        "name": "id",
                        "primaryKey": true,
                        "type": "_id_13"
                      },
                      {
                        "name": "client",
                        "type": "_id_19"
                      },
                      {
                        "name": "client$_identifier"
                      },
                      {
                        "name": "organization",
                        "type": "_id_19"
                      },
                      {
                        "name": "organization$_identifier"
                      },
                      {
                        "name": "active",
                        "type": "_id_20"
                      },
                      {
                        "name": "updated",
                        "type": "_id_16"
                      },
                      {
                        "name": "updatedBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "updatedBy$_identifier"
                      },
                      {
                        "name": "creationDate",
                        "type": "_id_16"
                      },
                      {
                        "name": "createdBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "createdBy$_identifier"
                      },
                      {
                        "name": "product",
                        "type": "_id_800060"
                      },
                      {
                        "name": "product$_identifier"
                      },
                      {
                        "name": "warehouse",
                        "type": "_id_19"
                      },
                      {
                        "name": "warehouse$_identifier"
                      },
                      {
                        "name": "productPrice",
                        "type": "_id_19"
                      },
                      {
                        "name": "productPrice$_identifier"
                      },
                      {
                        "name": "available",
                        "type": "_id_29"
                      },
                      {
                        "name": "qtyOnHand",
                        "type": "_id_29"
                      },
                      {
                        "name": "qtyReserved",
                        "type": "_id_29"
                      },
                      {
                        "name": "qtyOrdered",
                        "type": "_id_29"
                      },
                      {
                        "name": "netListPrice",
                        "type": "_id_800008"
                      },
                      {
                        "name": "standardPrice",
                        "type": "_id_800008"
                      },
                      {
                        "name": "priceLimit",
                        "type": "_id_800008"
                      },
                      {
                        "name": "orgwarehouse",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "product$searchKey",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "product$id",
                        "type": "_id_13"
                      },
                      {
                        "additional": true,
                        "name": "productPrice$priceListVersion$_identifier",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "available",
                        "type": "_id_29"
                      },
                      {
                        "additional": true,
                        "name": "product$genericProduct$_identifier",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "warehouse$_identifier",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "productPrice$priceListVersion$priceList$currency$id",
                        "type": "_id_13"
                      },
                      {
                        "additional": true,
                        "name": "priceLimit",
                        "type": "_id_800008"
                      },
                      {
                        "additional": true,
                        "name": "product$name",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "qtyOnHand",
                        "type": "_id_29"
                      },
                      {
                        "additional": true,
                        "name": "product$uOM$id",
                        "type": "_id_13"
                      },
                      {
                        "additional": true,
                        "name": "product$_identifier",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "product$characteristicDescription",
                        "type": "_id_C632F1CFF5A1453EB28BDF44A70478F8"
                      },
                      {
                        "additional": true,
                        "name": "qtyOrdered",
                        "type": "_id_29"
                      },
                      {
                        "additional": true,
                        "name": "standardPrice",
                        "type": "_id_800008"
                      },
                      {
                        "additional": true,
                        "name": "netListPrice",
                        "type": "_id_800008"
                      }
                    ],
                    "requestProperties": {
                      "params": {
                        "_extraProperties": "product$searchKey,product$id,productPrice$priceListVersion$_identifier,available,product$genericProduct$_identifier,warehouse$_identifier,productPrice$priceListVersion$priceList$currency$id,priceLimit,product$name,qtyOnHand,product$uOM$id,product$_identifier,product$characteristicDescription,qtyOrdered,standardPrice,netListPrice",
                        "adTabId": "673F978C60704C4289893EE1691784F1",
                        "columnName": "M_Product_ID",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "product"
                      }
                    }
                  },
                  "outFields": {
                    "netListPrice": {
                      "fieldName": "netListPrice",
                      "formatType": "",
                      "suffix": "_PLIST"
                    },
                    "priceLimit": {
                      "fieldName": "priceLimit",
                      "formatType": "",
                      "suffix": "_PLIM"
                    },
                    "product$uOM$id": {
                      "fieldName": "product$uOM$id",
                      "formatType": "",
                      "suffix": "_UOM"
                    },
                    "productPrice$priceListVersion$priceList$currency$id": {
                      "fieldName": "productPrice$priceListVersion$priceList$currency$id",
                      "formatType": "",
                      "suffix": "_CURR"
                    },
                    "standardPrice": {
                      "fieldName": "standardPrice",
                      "formatType": "",
                      "suffix": "_PSTD"
                    }
                  },
                  "outHiddenInputPrefix": "inpmProductId",
                  "pickListFields": [
                    {
                      "name": "_identifier",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "M_Product_ID",
                  "selectorDefinitionId": "2E64F551C7C4470C80C29DBA24B34A5F",
                  "selectorGridFields": [
                    {
                      "name": "product$searchKey",
                      "showHover": true,
                      "title": "Search Key",
                      "type": "_id_10"
                    },
                    {
                      "name": "product$name",
                      "showHover": true,
                      "title": "Name",
                      "type": "_id_10"
                    },
                    {
                      "name": "product$characteristicDescription",
                      "showHover": true,
                      "title": "Characteristic Description",
                      "type": "_id_C632F1CFF5A1453EB28BDF44A70478F8"
                    },
                    {
                      "filterOnKeypress": false,
                      "name": "available",
                      "showHover": true,
                      "title": "Available",
                      "type": "_id_29"
                    },
                    {
                      "canFilter": true,
                      "displayField": "warehouse$_identifier",
                      "filterEditorProperties": {
                        "entity": "Warehouse"
                      },
                      "filterEditorType": "OBSelectorFilterSelectItem",
                      "name": "warehouse",
                      "required": false,
                      "showHover": true,
                      "title": "Warehouse",
                      "type": "_id_19"
                    },
                    {
                      "filterOnKeypress": false,
                      "name": "standardPrice",
                      "showHover": true,
                      "title": "Unit Price",
                      "type": "_id_800008"
                    },
                    {
                      "filterOnKeypress": false,
                      "name": "netListPrice",
                      "showHover": true,
                      "title": "List Price",
                      "type": "_id_800008"
                    },
                    {
                      "canFilter": true,
                      "displayField": "productPrice$priceListVersion$_identifier",
                      "filterEditorProperties": {
                        "entity": "PricingPriceListVersion"
                      },
                      "filterEditorType": "OBSelectorFilterSelectItem",
                      "name": "productPrice$priceListVersion",
                      "required": false,
                      "showHover": true,
                      "title": "Price List Version",
                      "type": "_id_19"
                    },
                    {
                      "filterOnKeypress": false,
                      "name": "qtyOnHand",
                      "showHover": true,
                      "title": "Warehouse Qty.",
                      "type": "_id_29"
                    },
                    {
                      "filterOnKeypress": false,
                      "name": "qtyOrdered",
                      "showHover": true,
                      "title": "Ordered Qty.",
                      "type": "_id_29"
                    },
                    {
                      "filterOnKeypress": false,
                      "name": "priceLimit",
                      "showHover": true,
                      "title": "Price Limit",
                      "type": "_id_800008"
                    },
                    {
                      "canFilter": true,
                      "displayField": "product$genericProduct$_identifier",
                      "filterEditorProperties": {
                        "entity": "Product"
                      },
                      "filterEditorType": "OBSelectorFilterSelectItem",
                      "name": "product$genericProduct",
                      "required": false,
                      "showHover": true,
                      "title": "Generic Product",
                      "type": "_id_84ECA724EF074F679DFD69556C6DAF21"
                    }
                  ],
                  "sessionProperty": true,
                  "showSelectorGrid": true,
                  "targetEntity": "Product",
                  "textMatchStyle": "substring",
                  "title": "Product",
                  "type": "_id_800060",
                  "valueField": "product$id"
                },
                {
                  "columnName": "_propertyField_attributesetvalue_M_AttributeSetInstance_ID",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 22,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 4
                  },
                  "id": "8B1D408F5AFB471DA529A49583FD6D5B",
                  "inpColumnName": "inp_propertyField_attributesetvalue_M_AttributeSetInstance_ID",
                  "name": "orderlineRelated$attributeSetValue",
                  "refColumnName": "M_AttributeSetInstance_ID",
                  "sessionProperty": true,
                  "targetEntity": "AttributeSetInstance",
                  "title": "Attribute Set Value",
                  "type": "_id_35"
                },
                {
                  "defaultValue": "Audit",
                  "itemIds": [
                    "creationDate",
                    "createdBy",
                    "updated",
                    "updatedBy"
                  ],
                  "name": "1000100001",
                  "personalizable": false,
                  "title": "Audit",
                  "type": "OBAuditSectionItem"
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "creationDate",
                  "personalizable": false,
                  "title": "Creation Date",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "createdBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "createdBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Created By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updated",
                  "personalizable": false,
                  "title": "Updated",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "updatedBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updatedBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Updated By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "name": "_notes_",
                  "personalizable": false,
                  "type": "OBNoteSectionItem"
                },
                {
                  "name": "_notes_Canvas",
                  "personalizable": false,
                  "type": "OBNoteCanvasItem"
                },
                {
                  "name": "_linkedItems_",
                  "personalizable": false,
                  "type": "OBLinkedItemSectionItem"
                },
                {
                  "name": "_linkedItems_Canvas",
                  "personalizable": false,
                  "type": "OBLinkedItemCanvasItem"
                },
                {
                  "name": "_attachments_",
                  "personalizable": false,
                  "type": "OBAttachmentsSectionItem"
                },
                {
                  "name": "_attachments_Canvas",
                  "personalizable": false,
                  "type": "OBAttachmentCanvasItem"
                }
              ],
              "iconToolbarButtons": [],
              "initialPropertyToColumns": [
                {
                  "dbColumn": "AD_Org_ID",
                  "inpColumn": "inpadOrgId",
                  "property": "organization",
                  "sessionProperty": true,
                  "type": "_id_19"
                },
                {
                  "dbColumn": "Isactive",
                  "inpColumn": "inpisactive",
                  "property": "active",
                  "type": "_id_20"
                },
                {
                  "dbColumn": "C_Orderline_ID",
                  "inpColumn": "inpcOrderlineId",
                  "property": "salesOrderLine",
                  "type": "_id_2F18FEBF939D4F6DA5D5AEED73AE11D0"
                },
                {
                  "dbColumn": "C_Orderline_Related_ID",
                  "inpColumn": "inpcOrderlineRelatedId",
                  "property": "orderlineRelated",
                  "type": "_id_2F18FEBF939D4F6DA5D5AEED73AE11D0"
                },
                {
                  "dbColumn": "Amount",
                  "inpColumn": "inpamount",
                  "property": "amount",
                  "type": "_id_12"
                },
                {
                  "dbColumn": "Quantity",
                  "inpColumn": "inpquantity",
                  "property": "quantity",
                  "type": "_id_22"
                },
                {
                  "dbColumn": "C_Orderline_Servicerelation_ID",
                  "inpColumn": "inpcOrderlineServicerelationId",
                  "property": "id",
                  "type": "_id_13"
                },
                {
                  "dbColumn": "AD_Client_ID",
                  "inpColumn": "inpadClientId",
                  "property": "client",
                  "sessionProperty": true,
                  "type": "_id_19"
                },
                {
                  "dbColumn": "C_Orderline_Servicerelation_ID",
                  "inpColumn": "C_Orderline_Servicerelation_ID",
                  "property": "id",
                  "sessionProperty": true,
                  "type": "_id_13"
                }
              ],
              "isDeleteableTable": true,
              "mapping250": "/SalesOrder/RelatedProducts",
              "moduleId": "0",
              "notesDataSource": {
                "createClassName": "",
                "dataURL": "/etendo/org.openbravo.service.datasource/090A37D22E61FE94012E621729090048",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "table",
                    "type": "_id_19"
                  },
                  {
                    "name": "table$_identifier"
                  },
                  {
                    "name": "record",
                    "type": "_id_10"
                  },
                  {
                    "name": "note",
                    "type": "_id_14"
                  },
                  {
                    "name": "isactive",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  }
                ],
                "potentiallyShared": true,
                "requestProperties": {
                  "params": {
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier"
                  }
                }
              },
              "parentProperty": "salesOrderLine",
              "sessionAttributesNames": ["PRODUCTTYPE"],
              "showCloneButton": false,
              "showParentButtons": true,
              "standardProperties": {
                "inpkeyColumnId": "C_Orderline_Servicerelation_ID",
                "inpKeyName": "inpcOrderlineServicerelationId",
                "inpTabId": "673F978C60704C4289893EE1691784F1",
                "inpTableId": "3099A57126F24DC6BAFF15EDBF2B969D",
                "inpwindowId": "143",
                "keyColumnName": "C_Orderline_Servicerelation_ID",
                "keyProperty": "id",
                "keyPropertyType": "_id_13"
              },
              "statusBarFields": [],
              "tabId": "673F978C60704C4289893EE1691784F1",
              "tabTitle": "Related Products",
              "viewGrid": {
                "allowSummaryFunctions": true,
                "filterClause": false,
                "requiredGridProperties": [
                  "id",
                  "client",
                  "organization",
                  "updatedBy",
                  "updated",
                  "creationDate",
                  "createdBy",
                  "orderlineRelated",
                  "salesOrderLine",
                  "organization",
                  "client"
                ],
                "sortField": "documentNo",
                "uiPattern": "RO"
              }
            },
            {
              "actionToolbarButtons": [],
              "askToCloneChildren": true,
              "buttonsHaveSessionLogic": false,
              "dataSource": {
                "createClassName": "OBViewDataSource",
                "dataURL": "/etendo/org.openbravo.service.datasource/3C1148C0AB604DE1B51B7EA4112C325F",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "salesOrderLine",
                    "type": "_id_95E2A8B50A254B2AAE6774B8C2F28120"
                  },
                  {
                    "name": "salesOrderLine$_identifier"
                  },
                  {
                    "name": "orderlineRelated",
                    "type": "_id_95E2A8B50A254B2AAE6774B8C2F28120"
                  },
                  {
                    "name": "orderlineRelated$_identifier"
                  },
                  {
                    "name": "documentNo",
                    "type": "_id_10"
                  },
                  {
                    "name": "lineNo",
                    "type": "_id_11"
                  },
                  {
                    "name": "product",
                    "type": "_id_95E2A8B50A254B2AAE6774B8C2F28120"
                  },
                  {
                    "name": "product$_identifier"
                  },
                  {
                    "name": "attributeSetValue",
                    "type": "_id_35"
                  },
                  {
                    "name": "attributeSetValue$_identifier"
                  },
                  {
                    "name": "amount",
                    "type": "_id_12"
                  },
                  {
                    "name": "quantity",
                    "type": "_id_29"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_className": "OBViewDataSource",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier",
                    "tableId": "15EAF61631484A11B6921AB05A342E8B"
                  }
                }
              },
              "entity": "C_Orderline_Productrelation",
              "fields": [
                {
                  "columnName": "documentNo",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 60,
                    "length": 60,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 1
                  },
                  "id": "7BB7E7D9C47742F3B1A28F422DA288D4",
                  "inpColumnName": "inpdocumentno",
                  "length": 60,
                  "name": "documentNo",
                  "title": "Document No.",
                  "type": "_id_10"
                },
                {
                  "columnName": "lineNo",
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 2
                  },
                  "id": "EB702A9F37A143C1B4762936DABCEAED",
                  "inpColumnName": "inplineno",
                  "name": "lineNo",
                  "title": "Line No.",
                  "type": "_id_11"
                },
                {
                  "columnName": "product",
                  "defaultPopupFilterField": "name",
                  "disabled": true,
                  "displayField": "_identifier",
                  "extraSearchFields": ["name", "searchKey"],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 3
                  },
                  "id": "4F3595632F7248D98431E5E3CAA3A71E",
                  "inpColumnName": "inpproduct",
                  "name": "product",
                  "optionDataSource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/Product",
                    "fields": [
                      {
                        "name": "id",
                        "primaryKey": true,
                        "type": "_id_13"
                      },
                      {
                        "name": "client",
                        "type": "_id_19"
                      },
                      {
                        "name": "client$_identifier"
                      },
                      {
                        "name": "organization",
                        "type": "_id_19"
                      },
                      {
                        "name": "organization$_identifier"
                      },
                      {
                        "name": "active",
                        "type": "_id_20"
                      },
                      {
                        "name": "creationDate",
                        "type": "_id_16"
                      },
                      {
                        "name": "createdBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "createdBy$_identifier"
                      },
                      {
                        "name": "updated",
                        "type": "_id_16"
                      },
                      {
                        "name": "updatedBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "updatedBy$_identifier"
                      },
                      {
                        "name": "searchKey",
                        "type": "_id_10"
                      },
                      {
                        "name": "name",
                        "type": "_id_10"
                      },
                      {
                        "name": "description",
                        "type": "_id_10"
                      },
                      {
                        "name": "comments",
                        "type": "_id_14"
                      },
                      {
                        "name": "helpComment",
                        "type": "_id_14"
                      },
                      {
                        "name": "uPCEAN",
                        "type": "_id_10"
                      },
                      {
                        "name": "sKU",
                        "type": "_id_10"
                      },
                      {
                        "name": "uOM",
                        "type": "_id_19"
                      },
                      {
                        "name": "uOM$_identifier"
                      },
                      {
                        "name": "salesRepresentative",
                        "type": "_id_190"
                      },
                      {
                        "name": "salesRepresentative$_identifier"
                      },
                      {
                        "name": "summaryLevel",
                        "type": "_id_20"
                      },
                      {
                        "name": "stocked",
                        "type": "_id_20"
                      },
                      {
                        "name": "purchase",
                        "type": "_id_20"
                      },
                      {
                        "name": "sale",
                        "type": "_id_20"
                      },
                      {
                        "name": "billOfMaterials",
                        "type": "_id_20"
                      },
                      {
                        "name": "printDetailsOnInvoice",
                        "type": "_id_20"
                      },
                      {
                        "name": "printDetailsOnPickList",
                        "type": "_id_20"
                      },
                      {
                        "name": "bOMVerified",
                        "type": "_id_20"
                      },
                      {
                        "name": "productCategory",
                        "type": "_id_19"
                      },
                      {
                        "name": "productCategory$_identifier"
                      },
                      {
                        "name": "classification",
                        "type": "_id_10"
                      },
                      {
                        "name": "volume",
                        "type": "_id_22"
                      },
                      {
                        "name": "weight",
                        "type": "_id_22"
                      },
                      {
                        "name": "shelfWidth",
                        "type": "_id_22"
                      },
                      {
                        "name": "shelfHeight",
                        "type": "_id_22"
                      },
                      {
                        "name": "shelfDepth",
                        "type": "_id_22"
                      },
                      {
                        "name": "unitsPerPallet",
                        "type": "_id_11"
                      },
                      {
                        "name": "taxCategory",
                        "type": "_id_19"
                      },
                      {
                        "name": "taxCategory$_identifier"
                      },
                      {
                        "name": "resource",
                        "type": "_id_19"
                      },
                      {
                        "name": "resource$_identifier"
                      },
                      {
                        "name": "discontinued",
                        "type": "_id_20"
                      },
                      {
                        "name": "discontinuedBy",
                        "type": "_id_15"
                      },
                      {
                        "name": "processNow",
                        "type": "_id_28"
                      },
                      {
                        "name": "expenseType",
                        "type": "_id_19"
                      },
                      {
                        "name": "expenseType$_identifier"
                      },
                      {
                        "name": "productType",
                        "type": "_id_270",
                        "valueMap": {
                          "E": "Expense type",
                          "I": "Item",
                          "R": "Resource",
                          "S": "Service"
                        }
                      },
                      {
                        "name": "imageURL",
                        "type": "_id_10"
                      },
                      {
                        "name": "descriptionURL",
                        "type": "_id_10"
                      },
                      {
                        "name": "guaranteedDays",
                        "type": "_id_11"
                      },
                      {
                        "name": "versionNo",
                        "type": "_id_10"
                      },
                      {
                        "name": "attributeSet",
                        "type": "_id_19"
                      },
                      {
                        "name": "attributeSet$_identifier"
                      },
                      {
                        "name": "attributeSetValue",
                        "type": "_id_35"
                      },
                      {
                        "name": "attributeSetValue$_identifier"
                      },
                      {
                        "name": "downloadURL",
                        "type": "_id_10"
                      },
                      {
                        "name": "freightCategory",
                        "type": "_id_19"
                      },
                      {
                        "name": "freightCategory$_identifier"
                      },
                      {
                        "name": "storageBin",
                        "type": "_id_31"
                      },
                      {
                        "name": "storageBin$_identifier"
                      },
                      {
                        "name": "image",
                        "type": "_id_4AA6C3BE9D3B4D84A3B80489505A23E5"
                      },
                      {
                        "name": "image$_identifier"
                      },
                      {
                        "name": "businessPartner",
                        "type": "_id_800057"
                      },
                      {
                        "name": "businessPartner$_identifier"
                      },
                      {
                        "name": "printPrice",
                        "type": "_id_20"
                      },
                      {
                        "name": "name2",
                        "type": "_id_10"
                      },
                      {
                        "name": "minimumStock",
                        "type": "_id_22"
                      },
                      {
                        "name": "enforceAttribute",
                        "type": "_id_20"
                      },
                      {
                        "name": "calculated",
                        "type": "_id_20"
                      },
                      {
                        "name": "processPlan",
                        "type": "_id_19"
                      },
                      {
                        "name": "processPlan$_identifier"
                      },
                      {
                        "name": "production",
                        "type": "_id_20"
                      },
                      {
                        "name": "capacity",
                        "type": "_id_22"
                      },
                      {
                        "name": "minimumLeadTime",
                        "type": "_id_22"
                      },
                      {
                        "name": "planner",
                        "type": "_id_19"
                      },
                      {
                        "name": "planner$_identifier"
                      },
                      {
                        "name": "planningMethod",
                        "type": "_id_19"
                      },
                      {
                        "name": "planningMethod$_identifier"
                      },
                      {
                        "name": "maxQuantity",
                        "type": "_id_29"
                      },
                      {
                        "name": "minQuantity",
                        "type": "_id_29"
                      },
                      {
                        "name": "standardQuantity",
                        "type": "_id_29"
                      },
                      {
                        "name": "quantityType",
                        "type": "_id_20"
                      },
                      {
                        "name": "safetyStock",
                        "type": "_id_22"
                      },
                      {
                        "name": "useAttributeSetValueAs",
                        "type": "_id_5AD08D5DF85549E0BCC0DEBDE4C0D340",
                        "valueMap": {
                          "D": "Default",
                          "F": "Specification",
                          "O": "Overwrite Specification"
                        }
                      },
                      {
                        "name": "isquantityvariable",
                        "type": "_id_20"
                      },
                      {
                        "name": "deferredRevenue",
                        "type": "_id_20"
                      },
                      {
                        "name": "revenuePlanType",
                        "type": "_id_73625A8F22EF4CD7808603156BA606D7",
                        "valueMap": {
                          "M": "Monthly"
                        }
                      },
                      {
                        "name": "periodNumber",
                        "type": "_id_11"
                      },
                      {
                        "name": "isdeferredexpense",
                        "type": "_id_20"
                      },
                      {
                        "name": "expplantype",
                        "type": "_id_73625A8F22EF4CD7808603156BA606D7",
                        "valueMap": {
                          "M": "Monthly"
                        }
                      },
                      {
                        "name": "periodnumberExp",
                        "type": "_id_11"
                      },
                      {
                        "name": "defaultPeriod",
                        "type": "_id_6669508E338F4A10BA3E0D241D133E62",
                        "valueMap": {
                          "C": "Current Month",
                          "M": "Manual",
                          "N": "Next Month"
                        }
                      },
                      {
                        "name": "defaultPeriodExpense",
                        "type": "_id_6669508E338F4A10BA3E0D241D133E62",
                        "valueMap": {
                          "C": "Current Month",
                          "M": "Manual",
                          "N": "Next Month"
                        }
                      },
                      {
                        "name": "bookUsingPurchaseOrderPrice",
                        "type": "_id_20"
                      },
                      {
                        "name": "uOMForWeight",
                        "type": "_id_C3ED971A900A414B8A0A937B442374E1"
                      },
                      {
                        "name": "uOMForWeight$_identifier"
                      },
                      {
                        "name": "brand",
                        "type": "_id_19"
                      },
                      {
                        "name": "brand$_identifier"
                      },
                      {
                        "name": "isGeneric",
                        "type": "_id_20"
                      },
                      {
                        "name": "genericProduct",
                        "type": "_id_84ECA724EF074F679DFD69556C6DAF21"
                      },
                      {
                        "name": "genericProduct$_identifier"
                      },
                      {
                        "name": "createVariants",
                        "type": "_id_28"
                      },
                      {
                        "name": "characteristicDescription",
                        "type": "_id_C632F1CFF5A1453EB28BDF44A70478F8"
                      },
                      {
                        "name": "updateInvariants",
                        "type": "_id_28"
                      },
                      {
                        "name": "manageVariants",
                        "type": "_id_28"
                      },
                      {
                        "name": "includedProductCategories",
                        "type": "_id_800029",
                        "valueMap": {
                          "N": "Only those defined",
                          "Y": "All excluding defined"
                        }
                      },
                      {
                        "name": "includedProducts",
                        "type": "_id_800029",
                        "valueMap": {
                          "N": "Only those defined",
                          "Y": "All excluding defined"
                        }
                      },
                      {
                        "name": "printDescription",
                        "type": "_id_20"
                      },
                      {
                        "name": "returnable",
                        "type": "_id_20"
                      },
                      {
                        "name": "overdueReturnDays",
                        "type": "_id_11"
                      },
                      {
                        "name": "ispricerulebased",
                        "type": "_id_20"
                      },
                      {
                        "name": "uniquePerDocument",
                        "type": "_id_20"
                      },
                      {
                        "name": "relateprodcattoservice",
                        "type": "_id_28"
                      },
                      {
                        "name": "relateprodtoservice",
                        "type": "_id_28"
                      },
                      {
                        "name": "linkedToProduct",
                        "type": "_id_20"
                      },
                      {
                        "name": "quantityRule",
                        "type": "_id_4E07601C34764669B75FCA1808F55B57",
                        "valueMap": {
                          "PP": "As per product",
                          "UQ": "Unique quantity"
                        }
                      },
                      {
                        "name": "allowDeferredSell",
                        "type": "_id_20"
                      },
                      {
                        "name": "deferredSellMaxDays",
                        "type": "_id_11"
                      },
                      {
                        "name": "productStatus",
                        "type": "_id_16DFD3BFA69B4927A917A354FC1232FA"
                      },
                      {
                        "name": "productStatus$_identifier"
                      },
                      {
                        "name": "modifyTax",
                        "type": "_id_20"
                      },
                      {
                        "name": "relateprodcattaxtoservice",
                        "type": "_id_28"
                      },
                      {
                        "name": "copyservicemodifytaxconfig",
                        "type": "_id_28"
                      },
                      {
                        "additional": true,
                        "name": "productCategory$_identifier",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "name",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "searchKey",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "isGeneric",
                        "type": "_id_20"
                      },
                      {
                        "additional": true,
                        "name": "businessPartner$name",
                        "type": "_id_10"
                      },
                      {
                        "additional": true,
                        "name": "productStatus$name",
                        "type": "_id_10"
                      }
                    ],
                    "requestProperties": {
                      "params": {
                        "_extraProperties": "productCategory$_identifier,name,searchKey,isGeneric",
                        "adTabId": "652123A308954FE8AA072DE90EE7C988",
                        "columnName": "product",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "product"
                      }
                    }
                  },
                  "outFields": {},
                  "outHiddenInputPrefix": "inpproduct",
                  "pickListFields": [
                    {
                      "name": "_identifier",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "M_Product_ID",
                  "required": true,
                  "selectorDefinitionId": "1F051395F1CC4A40ADFE5C440EBCAA7F",
                  "selectorGridFields": [
                    {
                      "name": "searchKey",
                      "showHover": true,
                      "title": "Search Key",
                      "type": "_id_10"
                    },
                    {
                      "name": "name",
                      "showHover": true,
                      "title": "Name",
                      "type": "_id_10"
                    },
                    {
                      "canFilter": true,
                      "displayField": "productCategory$_identifier",
                      "filterEditorProperties": {
                        "entity": "ProductCategory"
                      },
                      "filterEditorType": "OBSelectorFilterSelectItem",
                      "name": "productCategory",
                      "required": false,
                      "showHover": true,
                      "title": "Product Category",
                      "type": "_id_19"
                    },
                    {
                      "name": "isGeneric",
                      "showHover": true,
                      "title": "Is Generic",
                      "type": "_id_20"
                    }
                  ],
                  "showSelectorGrid": true,
                  "targetEntity": "Product",
                  "textMatchStyle": "startsWith",
                  "title": "Product",
                  "type": "_id_D65D16C78404437AAB008E8040715D2F",
                  "updatable": false,
                  "valueField": "id"
                },
                {
                  "columnName": "attributeSetValue",
                  "disabled": true,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 22,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 4
                  },
                  "id": "C12DA55CA1E047FFA3EF69E04B4898F9",
                  "inpColumnName": "inpattributesetvalue",
                  "name": "attributeSetValue",
                  "refColumnName": "M_AttributeSetInstance_ID",
                  "targetEntity": "AttributeSetInstance",
                  "title": "Attribute Set Value",
                  "type": "_id_35"
                },
                {
                  "defaultValue": "Audit",
                  "itemIds": [
                    "creationDate",
                    "createdBy",
                    "updated",
                    "updatedBy"
                  ],
                  "name": "1000100001",
                  "personalizable": false,
                  "title": "Audit",
                  "type": "OBAuditSectionItem"
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "creationDate",
                  "personalizable": false,
                  "title": "Creation Date",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "createdBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "createdBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Created By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updated",
                  "personalizable": false,
                  "title": "Updated",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "updatedBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updatedBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Updated By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "name": "_notes_",
                  "personalizable": false,
                  "type": "OBNoteSectionItem"
                },
                {
                  "name": "_notes_Canvas",
                  "personalizable": false,
                  "type": "OBNoteCanvasItem"
                },
                {
                  "name": "_linkedItems_",
                  "personalizable": false,
                  "type": "OBLinkedItemSectionItem"
                },
                {
                  "name": "_linkedItems_Canvas",
                  "personalizable": false,
                  "type": "OBLinkedItemCanvasItem"
                },
                {
                  "name": "_attachments_",
                  "personalizable": false,
                  "type": "OBAttachmentsSectionItem"
                },
                {
                  "name": "_attachments_Canvas",
                  "personalizable": false,
                  "type": "OBAttachmentCanvasItem"
                }
              ],
              "iconToolbarButtons": [],
              "initialPropertyToColumns": [
                {
                  "dbColumn": "amount",
                  "inpColumn": "inpamount",
                  "property": "amount",
                  "type": "_id_12"
                },
                {
                  "dbColumn": "quantity",
                  "inpColumn": "inpquantity",
                  "property": "quantity",
                  "type": "_id_29"
                },
                {
                  "dbColumn": "id",
                  "inpColumn": "id",
                  "property": "id",
                  "sessionProperty": true,
                  "type": "_id_13"
                }
              ],
              "isDeleteableTable": true,
              "mapping250": "/SalesOrder/RelatedServices",
              "moduleId": "0",
              "notesDataSource": {
                "createClassName": "",
                "dataURL": "/etendo/org.openbravo.service.datasource/090A37D22E61FE94012E621729090048",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "table",
                    "type": "_id_19"
                  },
                  {
                    "name": "table$_identifier"
                  },
                  {
                    "name": "record",
                    "type": "_id_10"
                  },
                  {
                    "name": "note",
                    "type": "_id_14"
                  },
                  {
                    "name": "isactive",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  }
                ],
                "potentiallyShared": true,
                "requestProperties": {
                  "params": {
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier"
                  }
                }
              },
              "parentProperty": "orderlineRelated",
              "sessionAttributesNames": ["HASRELATEDSERVICE"],
              "showCloneButton": false,
              "showParentButtons": true,
              "standardProperties": {
                "inpkeyColumnId": "id",
                "inpKeyName": "inpid",
                "inpTabId": "652123A308954FE8AA072DE90EE7C988",
                "inpTableId": "15EAF61631484A11B6921AB05A342E8B",
                "inpwindowId": "143",
                "keyColumnName": "id",
                "keyProperty": "id",
                "keyPropertyType": "_id_13"
              },
              "statusBarFields": [],
              "tabId": "652123A308954FE8AA072DE90EE7C988",
              "tabTitle": "Related Services",
              "viewGrid": {
                "allowSummaryFunctions": false,
                "filterClause": false,
                "requiredGridProperties": [
                  "id",
                  "client",
                  "organization",
                  "updatedBy",
                  "updated",
                  "creationDate",
                  "createdBy",
                  "salesOrderLine",
                  "amount",
                  "orderlineRelated"
                ],
                "sortField": "lineNo",
                "uiPattern": "RO"
              }
            }
          ],
          "dataSource": {
            "createClassName": "OBViewDataSource",
            "dataURL": "/etendo/org.openbravo.service.datasource/OrderLine",
            "fields": [
              {
                "name": "id",
                "primaryKey": true,
                "type": "_id_13"
              },
              {
                "name": "client",
                "type": "_id_19"
              },
              {
                "name": "client$_identifier"
              },
              {
                "name": "organization",
                "type": "_id_19"
              },
              {
                "name": "organization$_identifier"
              },
              {
                "name": "active",
                "type": "_id_20"
              },
              {
                "name": "creationDate",
                "type": "_id_16"
              },
              {
                "name": "createdBy",
                "type": "_id_30"
              },
              {
                "name": "createdBy$_identifier"
              },
              {
                "name": "updated",
                "type": "_id_16"
              },
              {
                "name": "updatedBy",
                "type": "_id_30"
              },
              {
                "name": "updatedBy$_identifier"
              },
              {
                "name": "salesOrder",
                "type": "_id_800062"
              },
              {
                "name": "salesOrder$_identifier"
              },
              {
                "name": "lineNo",
                "type": "_id_11"
              },
              {
                "name": "businessPartner",
                "type": "_id_800057"
              },
              {
                "name": "businessPartner$_identifier"
              },
              {
                "name": "partnerAddress",
                "type": "_id_19"
              },
              {
                "name": "partnerAddress$_identifier"
              },
              {
                "name": "orderDate",
                "type": "_id_15"
              },
              {
                "name": "scheduledDeliveryDate",
                "type": "_id_15"
              },
              {
                "name": "dateDelivered",
                "type": "_id_15"
              },
              {
                "name": "invoiceDate",
                "type": "_id_15"
              },
              {
                "name": "description",
                "type": "_id_14"
              },
              {
                "name": "product",
                "type": "_id_800060"
              },
              {
                "name": "product$_identifier"
              },
              {
                "name": "warehouse",
                "type": "_id_197"
              },
              {
                "name": "warehouse$_identifier"
              },
              {
                "name": "directShipment",
                "type": "_id_20"
              },
              {
                "name": "uOM",
                "type": "_id_19"
              },
              {
                "name": "uOM$_identifier"
              },
              {
                "name": "orderedQuantity",
                "type": "_id_29"
              },
              {
                "name": "reservedQuantity",
                "type": "_id_29"
              },
              {
                "name": "deliveredQuantity",
                "type": "_id_29"
              },
              {
                "name": "invoicedQuantity",
                "type": "_id_29"
              },
              {
                "name": "shippingCompany",
                "type": "_id_19"
              },
              {
                "name": "shippingCompany$_identifier"
              },
              {
                "name": "currency",
                "type": "_id_19"
              },
              {
                "name": "currency$_identifier"
              },
              {
                "name": "listPrice",
                "type": "_id_800008"
              },
              {
                "name": "unitPrice",
                "type": "_id_800008"
              },
              {
                "name": "priceLimit",
                "type": "_id_800008"
              },
              {
                "name": "lineNetAmount",
                "type": "_id_12"
              },
              {
                "name": "discount",
                "type": "_id_22"
              },
              {
                "name": "freightAmount",
                "type": "_id_12"
              },
              {
                "name": "charge",
                "type": "_id_19"
              },
              {
                "name": "charge$_identifier"
              },
              {
                "name": "chargeAmount",
                "type": "_id_12"
              },
              {
                "name": "tax",
                "type": "_id_158"
              },
              {
                "name": "tax$_identifier"
              },
              {
                "name": "resourceAssignment",
                "type": "_id_33"
              },
              {
                "name": "resourceAssignment$_identifier"
              },
              {
                "name": "sOPOReference",
                "type": "_id_30"
              },
              {
                "name": "sOPOReference$_identifier"
              },
              {
                "name": "attributeSetValue",
                "type": "_id_35"
              },
              {
                "name": "attributeSetValue$_identifier"
              },
              {
                "name": "descriptionOnly",
                "type": "_id_20"
              },
              {
                "name": "orderQuantity",
                "type": "_id_29"
              },
              {
                "name": "orderUOM",
                "type": "_id_101787D75B4E4D7280C75D9802FE5FB6"
              },
              {
                "name": "orderUOM$_identifier"
              },
              {
                "name": "priceAdjustment",
                "type": "_id_8238E1DF040B4641877766194CD1EF33"
              },
              {
                "name": "priceAdjustment$_identifier"
              },
              {
                "name": "standardPrice",
                "type": "_id_800008"
              },
              {
                "name": "cancelPriceAdjustment",
                "type": "_id_20"
              },
              {
                "name": "orderDiscount",
                "type": "_id_19"
              },
              {
                "name": "orderDiscount$_identifier"
              },
              {
                "name": "editLineAmount",
                "type": "_id_20"
              },
              {
                "name": "taxableAmount",
                "type": "_id_12"
              },
              {
                "name": "goodsShipmentLine",
                "type": "_id_224C53E343404771A44494C2AD51DAF3"
              },
              {
                "name": "goodsShipmentLine$_identifier"
              },
              {
                "name": "returnReason",
                "type": "_id_19"
              },
              {
                "name": "returnReason$_identifier"
              },
              {
                "name": "grossUnitPrice",
                "type": "_id_800008"
              },
              {
                "name": "lineGrossAmount",
                "type": "_id_12"
              },
              {
                "name": "grossListPrice",
                "type": "_id_22"
              },
              {
                "name": "costcenter",
                "type": "_id_DEE6B917B36D4648B2DA729FC2872CF4"
              },
              {
                "name": "costcenter$_identifier"
              },
              {
                "name": "baseGrossUnitPrice",
                "type": "_id_800008"
              },
              {
                "name": "asset",
                "type": "_id_444F3B4F45544B9CA45E4035D49C1176"
              },
              {
                "name": "asset$_identifier"
              },
              {
                "name": "warehouseRule",
                "type": "_id_19"
              },
              {
                "name": "warehouseRule$_identifier"
              },
              {
                "name": "stDimension",
                "type": "_id_0E0D1661E18E4E05A118785A7CF146B8"
              },
              {
                "name": "stDimension$_identifier"
              },
              {
                "name": "quotationLine",
                "type": "_id_800063"
              },
              {
                "name": "quotationLine$_identifier"
              },
              {
                "name": "ndDimension",
                "type": "_id_1850A5390D97470EBB35A3A5F43AB533"
              },
              {
                "name": "ndDimension$_identifier"
              },
              {
                "name": "createReservation",
                "type": "_id_1852D69AB3FD453F8F031813501B26F0",
                "valueMap": {
                  "CR": "Manual",
                  "CRP": "Automatic"
                }
              },
              {
                "name": "project",
                "type": "_id_800061"
              },
              {
                "name": "project$_identifier"
              },
              {
                "name": "reservationStatus",
                "type": "_id_C3C19DE8AB3B42E78748E20D986FBBC9",
                "valueMap": {
                  "CR": "Completely Reserved",
                  "NR": "Not Reserved",
                  "PR": "Partially Reserved"
                }
              },
              {
                "name": "manageReservation",
                "type": "_id_28"
              },
              {
                "name": "managePrereservation",
                "type": "_id_28"
              },
              {
                "name": "explode",
                "type": "_id_28"
              },
              {
                "name": "bOMParent",
                "type": "_id_800063"
              },
              {
                "name": "bOMParent$_identifier"
              },
              {
                "name": "replacedorderline",
                "type": "_id_271"
              },
              {
                "name": "replacedorderline$_identifier"
              },
              {
                "name": "printDescription",
                "type": "_id_20"
              },
              {
                "name": "overdueReturnDays",
                "type": "_id_11"
              },
              {
                "name": "selectOrderLine",
                "type": "_id_28"
              },
              {
                "name": "operativeUOM",
                "type": "_id_D8CABB4103B14B42BE3064A68C600935"
              },
              {
                "name": "operativeUOM$_identifier"
              },
              {
                "name": "operativeQuantity",
                "type": "_id_29"
              },
              {
                "name": "returnline",
                "type": "_id_10"
              },
              {
                "additional": true,
                "name": "businessPartner$name",
                "type": "_id_10"
              }
            ],
            "potentiallyShared": true,
            "requestProperties": {
              "params": {
                "_className": "OBViewDataSource",
                "Constants_FIELDSEPARATOR": "$",
                "Constants_IDENTIFIER": "_identifier"
              }
            }
          },
          "entity": "OrderLine",
          "fields": [
            {
              "columnName": "Line",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 1
              },
              "hasDefaultValue": true,
              "id": "1120",
              "inpColumnName": "inpline",
              "name": "lineNo",
              "required": true,
              "title": "Line No.",
              "type": "_id_11"
            },
            {
              "columnName": "M_Product_ID",
              "datasource": {
                "createClassName": "",
                "dataURL": "/etendo/org.openbravo.service.datasource/ProductByPriceAndWarehouse",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "active",
                    "type": "_id_20"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "product",
                    "type": "_id_800060"
                  },
                  {
                    "name": "product$_identifier"
                  },
                  {
                    "name": "warehouse",
                    "type": "_id_19"
                  },
                  {
                    "name": "warehouse$_identifier"
                  },
                  {
                    "name": "productPrice",
                    "type": "_id_19"
                  },
                  {
                    "name": "productPrice$_identifier"
                  },
                  {
                    "name": "available",
                    "type": "_id_29"
                  },
                  {
                    "name": "qtyOnHand",
                    "type": "_id_29"
                  },
                  {
                    "name": "qtyReserved",
                    "type": "_id_29"
                  },
                  {
                    "name": "qtyOrdered",
                    "type": "_id_29"
                  },
                  {
                    "name": "netListPrice",
                    "type": "_id_800008"
                  },
                  {
                    "name": "standardPrice",
                    "type": "_id_800008"
                  },
                  {
                    "name": "priceLimit",
                    "type": "_id_800008"
                  },
                  {
                    "name": "orgwarehouse",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "product$searchKey",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "product$id",
                    "type": "_id_13"
                  },
                  {
                    "additional": true,
                    "name": "productPrice$priceListVersion$_identifier",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "available",
                    "type": "_id_29"
                  },
                  {
                    "additional": true,
                    "name": "product$genericProduct$_identifier",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "warehouse$_identifier",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "productPrice$priceListVersion$priceList$currency$id",
                    "type": "_id_13"
                  },
                  {
                    "additional": true,
                    "name": "priceLimit",
                    "type": "_id_800008"
                  },
                  {
                    "additional": true,
                    "name": "product$name",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "qtyOnHand",
                    "type": "_id_29"
                  },
                  {
                    "additional": true,
                    "name": "product$uOM$id",
                    "type": "_id_13"
                  },
                  {
                    "additional": true,
                    "name": "product$_identifier",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "product$characteristicDescription",
                    "type": "_id_C632F1CFF5A1453EB28BDF44A70478F8"
                  },
                  {
                    "additional": true,
                    "name": "qtyOrdered",
                    "type": "_id_29"
                  },
                  {
                    "additional": true,
                    "name": "standardPrice",
                    "type": "_id_800008"
                  },
                  {
                    "additional": true,
                    "name": "netListPrice",
                    "type": "_id_800008"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_extraProperties": "product$searchKey,product$id,productPrice$priceListVersion$_identifier,available,product$genericProduct$_identifier,warehouse$_identifier,productPrice$priceListVersion$priceList$currency$id,priceLimit,product$name,qtyOnHand,product$uOM$id,product$_identifier,product$characteristicDescription,qtyOrdered,standardPrice,netListPrice",
                    "adTabId": "187",
                    "columnName": "M_Product_ID",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier",
                    "IsSelectorItem": "true",
                    "targetProperty": "product"
                  }
                }
              },
              "defaultPopupFilterField": "_identifier",
              "displayField": "_identifier",
              "extraSearchFields": [
                "product$searchKey",
                "product$name",
                "product$_identifier"
              ],
              "firstFocusedField": true,
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 44,
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "sort": 2
              },
              "id": "1127",
              "inpColumnName": "inpmProductId",
              "name": "product",
              "outFields": {
                "netListPrice": {
                  "fieldName": "netListPrice",
                  "formatType": "",
                  "suffix": "_PLIST"
                },
                "priceLimit": {
                  "fieldName": "priceLimit",
                  "formatType": "",
                  "suffix": "_PLIM"
                },
                "product$uOM$id": {
                  "fieldName": "product$uOM$id",
                  "formatType": "",
                  "suffix": "_UOM"
                },
                "productPrice$priceListVersion$priceList$currency$id": {
                  "fieldName": "productPrice$priceListVersion$priceList$currency$id",
                  "formatType": "",
                  "suffix": "_CURR"
                },
                "standardPrice": {
                  "fieldName": "standardPrice",
                  "formatType": "",
                  "suffix": "_PSTD"
                }
              },
              "outHiddenInputPrefix": "inpmProductId",
              "pickListFields": [
                {
                  "name": "_identifier",
                  "title": " ",
                  "type": "text"
                }
              ],
              "popupTextMatchStyle": "substring",
              "refColumnName": "M_Product_ID",
              "required": true,
              "selectorDefinitionId": "2E64F551C7C4470C80C29DBA24B34A5F",
              "selectorGridFields": [
                {
                  "name": "product$searchKey",
                  "showHover": true,
                  "title": "Search Key",
                  "type": "_id_10"
                },
                {
                  "name": "product$name",
                  "showHover": true,
                  "title": "Name",
                  "type": "_id_10"
                },
                {
                  "name": "product$characteristicDescription",
                  "showHover": true,
                  "title": "Characteristic Description",
                  "type": "_id_C632F1CFF5A1453EB28BDF44A70478F8"
                },
                {
                  "filterOnKeypress": false,
                  "name": "available",
                  "showHover": true,
                  "title": "Available",
                  "type": "_id_29"
                },
                {
                  "canFilter": true,
                  "displayField": "warehouse$_identifier",
                  "filterEditorProperties": {
                    "entity": "Warehouse"
                  },
                  "filterEditorType": "OBSelectorFilterSelectItem",
                  "name": "warehouse",
                  "required": false,
                  "showHover": true,
                  "title": "Warehouse",
                  "type": "_id_19"
                },
                {
                  "filterOnKeypress": false,
                  "name": "standardPrice",
                  "showHover": true,
                  "title": "Unit Price",
                  "type": "_id_800008"
                },
                {
                  "filterOnKeypress": false,
                  "name": "netListPrice",
                  "showHover": true,
                  "title": "List Price",
                  "type": "_id_800008"
                },
                {
                  "canFilter": true,
                  "displayField": "productPrice$priceListVersion$_identifier",
                  "filterEditorProperties": {
                    "entity": "PricingPriceListVersion"
                  },
                  "filterEditorType": "OBSelectorFilterSelectItem",
                  "name": "productPrice$priceListVersion",
                  "required": false,
                  "showHover": true,
                  "title": "Price List Version",
                  "type": "_id_19"
                },
                {
                  "filterOnKeypress": false,
                  "name": "qtyOnHand",
                  "showHover": true,
                  "title": "Warehouse Qty.",
                  "type": "_id_29"
                },
                {
                  "filterOnKeypress": false,
                  "name": "qtyOrdered",
                  "showHover": true,
                  "title": "Ordered Qty.",
                  "type": "_id_29"
                },
                {
                  "filterOnKeypress": false,
                  "name": "priceLimit",
                  "showHover": true,
                  "title": "Price Limit",
                  "type": "_id_800008"
                },
                {
                  "canFilter": true,
                  "displayField": "product$genericProduct$_identifier",
                  "filterEditorProperties": {
                    "entity": "Product"
                  },
                  "filterEditorType": "OBSelectorFilterSelectItem",
                  "name": "product$genericProduct",
                  "required": false,
                  "showHover": true,
                  "title": "Generic Product",
                  "type": "_id_84ECA724EF074F679DFD69556C6DAF21"
                }
              ],
              "sessionProperty": true,
              "showSelectorGrid": true,
              "targetEntity": "Product",
              "textMatchStyle": "substring",
              "title": "Product",
              "type": "_id_800060",
              "valueField": "product$id"
            },
            {
              "columnName": "Aumqty",
              "displayed": false,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 3
              },
              "id": "3F12E6F426BD4F31BD1F5470F6EF08BF",
              "inpColumnName": "inpaumqty",
              "name": "operativeQuantity",
              "title": "Operative Quantity",
              "type": "_id_29"
            },
            {
              "columnName": "C_Aum",
              "displayed": false,
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 32,
                "displayProperty": "name",
                "editorProps": {
                  "displayField": "_identifier",
                  "valueField": "id"
                },
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 4
              },
              "id": "E2FF7E4864974074AFF50E05037A0176",
              "inpColumnName": "inpcAum",
              "name": "operativeUOM",
              "refColumnName": "C_UOM_ID",
              "targetEntity": "UOM",
              "title": "Alternative UOM",
              "type": "_id_D8CABB4103B14B42BE3064A68C600935"
            },
            {
              "columnName": "QtyOrdered",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 5
              },
              "hasDefaultValue": true,
              "id": "1130",
              "inpColumnName": "inpqtyordered",
              "name": "orderedQuantity",
              "redrawOnChange": true,
              "required": true,
              "title": "Ordered Quantity",
              "type": "_id_29"
            },
            {
              "columnName": "C_UOM_ID",
              "disabled": true,
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 44,
                "editorProps": {
                  "displayField": "_identifier",
                  "valueField": "id"
                },
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "sort": 6
              },
              "id": "1128",
              "inpColumnName": "inpcUomId",
              "name": "uOM",
              "refColumnName": "C_UOM_ID",
              "required": true,
              "sessionProperty": true,
              "targetEntity": "UOM",
              "title": "UOM",
              "type": "_id_19"
            },
            {
              "columnName": "M_AttributeSetInstance_ID",
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 14,
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "sort": 7
              },
              "id": "6570",
              "inpColumnName": "inpmAttributesetinstanceId",
              "name": "attributeSetValue",
              "redrawOnChange": true,
              "refColumnName": "M_AttributeSetInstance_ID",
              "sessionProperty": true,
              "targetEntity": "AttributeSetInstance",
              "title": "Attribute Set Value",
              "type": "_id_35"
            },
            {
              "columnName": "PriceActual",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 8
              },
              "id": "1138",
              "inpColumnName": "inppriceactual",
              "name": "unitPrice",
              "required": true,
              "title": "Net Unit Price",
              "type": "_id_800008"
            },
            {
              "columnName": "Gross_Unit_Price",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 9
              },
              "hasDefaultValue": true,
              "id": "71F61AF7C4FC4710904B117D18F56109",
              "inpColumnName": "inpgrossUnitPrice",
              "name": "grossUnitPrice",
              "title": "Gross Unit Price",
              "type": "_id_800008"
            },
            {
              "columnName": "LineNetAmt",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 10
              },
              "id": "2880",
              "inpColumnName": "inplinenetamt",
              "name": "lineNetAmount",
              "required": true,
              "title": "Line Net Amount",
              "type": "_id_12"
            },
            {
              "columnName": "Line_Gross_Amount",
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 11
              },
              "hasDefaultValue": true,
              "id": "453A06D8F77F487A86A1A2238C7F575B",
              "inpColumnName": "inplineGrossAmount",
              "name": "lineGrossAmount",
              "title": "Line Gross Amount",
              "type": "_id_12"
            },
            {
              "columnName": "C_Tax_ID",
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "criteriaDisplayField": "name",
                "criteriaField": "tax$name",
                "displaylength": 44,
                "displayProperty": "name",
                "editorProps": {
                  "displayField": "_identifier",
                  "valueField": "id"
                },
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "sort": 12
              },
              "id": "1141",
              "inpColumnName": "inpcTaxId",
              "name": "tax",
              "refColumnName": "C_Tax_ID",
              "required": true,
              "targetEntity": "FinancialMgmtTaxRate",
              "title": "Tax",
              "type": "_id_158"
            },
            {
              "columnName": "PriceList",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 13
              },
              "id": "1137",
              "inpColumnName": "inppricelist",
              "name": "listPrice",
              "required": true,
              "title": "Net List Price",
              "type": "_id_800008"
            },
            {
              "columnName": "GrossPriceList",
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 14
              },
              "id": "C4EEC6CC73A96B7BE040007F0100175B",
              "inpColumnName": "inpgrosspricelist",
              "name": "grossListPrice",
              "title": "Gross List Price",
              "type": "_id_22"
            },
            {
              "columnName": "Discount",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 15
              },
              "hasDefaultValue": true,
              "id": "3124",
              "inpColumnName": "inpdiscount",
              "name": "discount",
              "title": "Discount",
              "type": "_id_22"
            },
            {
              "columnName": "M_Warehouse_Rule_ID",
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 32,
                "editorProps": {
                  "displayField": "_identifier",
                  "valueField": "id"
                },
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 16
              },
              "id": "CB9E2FD2CC1FDE61E040007F010001E1",
              "inpColumnName": "inpmWarehouseRuleId",
              "name": "warehouseRule",
              "refColumnName": "M_Warehouse_Rule_ID",
              "targetEntity": "WarehouseRule",
              "title": "Warehouse Rule",
              "type": "_id_19"
            },
            {
              "colSpan": 2,
              "columnName": "Description",
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": false,
                "displaylength": 60,
                "editorType": "OBPopUpTextAreaItem",
                "length": 2000,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 17
              },
              "id": "1126",
              "inpColumnName": "inpdescription",
              "length": 2000,
              "name": "description",
              "rowSpan": 2,
              "title": "Description",
              "type": "_id_14"
            },
            {
              "columnName": "Replacedorderline_id",
              "disabled": true,
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "criteriaDisplayField": "lineNo",
                "criteriaField": "replacedorderline$lineNo",
                "displaylength": 32,
                "displayProperty": "lineNo",
                "editorProps": {
                  "displayField": "_identifier",
                  "valueField": "id"
                },
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 18
              },
              "id": "E03B2279B7F54EE1BDCDCD21D2AFF7F6",
              "inpColumnName": "inpreplacedorderlineId",
              "name": "replacedorderline",
              "redrawOnChange": true,
              "refColumnName": "C_OrderLine_ID",
              "targetEntity": "OrderLine",
              "title": "Replaced Order Line",
              "type": "_id_271"
            },
            {
              "columnName": "Create_Reservation",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "displaylength": 60,
                "filterOnKeypress": false,
                "length": 60,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 19
              },
              "id": "CCCD4467ED5A4D7AE040007F01006A45",
              "inpColumnName": "inpcreateReservation",
              "name": "createReservation",
              "title": "Stock Reservation",
              "type": "_id_1852D69AB3FD453F8F031813501B26F0"
            },
            {
              "defaultValue": "More Information",
              "itemIds": ["taxableAmount", "quotationLine"],
              "name": "402880E72F1C15A5012F1C7AA98B00E8",
              "title": "More Information",
              "type": "OBSectionItem"
            },
            {
              "columnName": "Taxbaseamt",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 20
              },
              "id": "7E37B8136CC375EFE040007F0100360F",
              "inpColumnName": "inptaxbaseamt",
              "name": "taxableAmount",
              "title": "Alternate Taxable Amount",
              "type": "_id_12"
            },
            {
              "columnName": "Quotationline_ID",
              "disabled": true,
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 32,
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 23
              },
              "id": "BC969C5DF73F4E3D9DFCDC37501CD288",
              "inFields": [
                {
                  "columnName": "inpcBpartnerId",
                  "parameterName": "inpcBpartnerId"
                },
                {
                  "columnName": "inpmProductId",
                  "parameterName": "inpmProductId"
                },
                {
                  "columnName": "inpadOrgId",
                  "parameterName": "inpAD_Org_ID"
                }
              ],
              "inpColumnName": "inpquotationlineId",
              "name": "quotationLine",
              "outFields": [],
              "redrawOnChange": true,
              "refColumnName": "C_OrderLine_ID",
              "searchUrl": "/info/SalesOrderLine.html",
              "targetEntity": "OrderLine",
              "title": "Quotation Line",
              "type": "_id_800063",
              "updatable": false
            },
            {
              "defaultValue": "Service Product Line",
              "itemIds": ["printDescription", "overdueReturnDays"],
              "name": "95B37D4EFC654CB5A09443C80A8ED5C1",
              "sectionExpanded": true,
              "title": "Service Product Line",
              "type": "OBSectionItem"
            },
            {
              "columnName": "Print_Description",
              "gridProps": {
                "autoFitWidth": false,
                "canFilter": true,
                "canGroupBy": false,
                "canSort": true,
                "editorProps": {
                  "showLabel": false,
                  "showTitle": false
                },
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 25,
                "width": "*",
                "yesNo": true
              },
              "hasDefaultValue": true,
              "id": "318588F6E35249488A0470C1905F3E0B",
              "inpColumnName": "inpprintDescription",
              "name": "printDescription",
              "overflow": "visible",
              "title": "Print Description",
              "type": "_id_20",
              "width": 1
            },
            {
              "columnName": "Overdue_Return_Days",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 26
              },
              "id": "3FBDF73F4DF0435FAD3C99C5BF23D36A",
              "inpColumnName": "inpoverdueReturnDays",
              "name": "overdueReturnDays",
              "title": "Overdue Return Days",
              "type": "_id_11"
            },
            {
              "defaultValue": "Dimensions",
              "itemIds": [
                "organization",
                "project",
                "costcenter",
                "asset",
                "stDimension",
                "ndDimension"
              ],
              "name": "800000",
              "sectionExpanded": true,
              "title": "Dimensions",
              "type": "OBSectionItem"
            },
            {
              "columnName": "AD_Org_ID",
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 44,
                "editorProps": {
                  "displayField": "_identifier",
                  "valueField": "id"
                },
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 27
              },
              "hasDefaultValue": true,
              "id": "2053",
              "inpColumnName": "inpadOrgId",
              "name": "organization",
              "refColumnName": "AD_Org_ID",
              "required": true,
              "targetEntity": "Organization",
              "title": "Organization",
              "type": "_id_19"
            },
            {
              "columnName": "C_Project_ID",
              "datasource": {
                "createClassName": "",
                "dataURL": "/etendo/org.openbravo.service.datasource/Project",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "active",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  },
                  {
                    "name": "searchKey",
                    "type": "_id_10"
                  },
                  {
                    "name": "name",
                    "type": "_id_10"
                  },
                  {
                    "name": "description",
                    "type": "_id_14"
                  },
                  {
                    "name": "comments",
                    "type": "_id_14"
                  },
                  {
                    "name": "summaryLevel",
                    "type": "_id_20"
                  },
                  {
                    "name": "userContact",
                    "type": "_id_19"
                  },
                  {
                    "name": "userContact$_identifier"
                  },
                  {
                    "name": "businessPartner",
                    "type": "_id_800057"
                  },
                  {
                    "name": "businessPartner$_identifier"
                  },
                  {
                    "name": "partnerAddress",
                    "type": "_id_19"
                  },
                  {
                    "name": "partnerAddress$_identifier"
                  },
                  {
                    "name": "orderReference",
                    "type": "_id_10"
                  },
                  {
                    "name": "paymentTerms",
                    "type": "_id_19"
                  },
                  {
                    "name": "paymentTerms$_identifier"
                  },
                  {
                    "name": "currency",
                    "type": "_id_19"
                  },
                  {
                    "name": "currency$_identifier"
                  },
                  {
                    "name": "createTemporaryPriceList",
                    "type": "_id_20"
                  },
                  {
                    "name": "priceListVersion",
                    "type": "_id_19"
                  },
                  {
                    "name": "priceListVersion$_identifier"
                  },
                  {
                    "name": "salesCampaign",
                    "type": "_id_19"
                  },
                  {
                    "name": "salesCampaign$_identifier"
                  },
                  {
                    "name": "legallyBindingContract",
                    "type": "_id_20"
                  },
                  {
                    "name": "plannedAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "plannedQuantity",
                    "type": "_id_29"
                  },
                  {
                    "name": "plannedMargin",
                    "type": "_id_12"
                  },
                  {
                    "name": "contractAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "contractDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "endingDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "generateTo",
                    "type": "_id_28"
                  },
                  {
                    "name": "processed",
                    "type": "_id_20"
                  },
                  {
                    "name": "salesRepresentative",
                    "type": "_id_190"
                  },
                  {
                    "name": "salesRepresentative$_identifier"
                  },
                  {
                    "name": "copyFrom",
                    "type": "_id_28"
                  },
                  {
                    "name": "projectType",
                    "type": "_id_19"
                  },
                  {
                    "name": "projectType$_identifier"
                  },
                  {
                    "name": "contractQuantity",
                    "type": "_id_29"
                  },
                  {
                    "name": "invoiceAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "invoiceQuantity",
                    "type": "_id_29"
                  },
                  {
                    "name": "projectBalance",
                    "type": "_id_12"
                  },
                  {
                    "name": "standardPhase",
                    "type": "_id_19"
                  },
                  {
                    "name": "standardPhase$_identifier"
                  },
                  {
                    "name": "projectPhase",
                    "type": "_id_19"
                  },
                  {
                    "name": "projectPhase$_identifier"
                  },
                  {
                    "name": "priceCeiling",
                    "type": "_id_20"
                  },
                  {
                    "name": "warehouse",
                    "type": "_id_19"
                  },
                  {
                    "name": "warehouse$_identifier"
                  },
                  {
                    "name": "projectCategory",
                    "type": "_id_288",
                    "valueMap": {
                      "S": "Multiphase Project"
                    }
                  },
                  {
                    "name": "processNow",
                    "type": "_id_28"
                  },
                  {
                    "name": "initiativeType",
                    "type": "_id_800005",
                    "valueMap": {
                      "PR": "Private",
                      "PU": "Public"
                    }
                  },
                  {
                    "name": "projectStatus",
                    "type": "_id_800002",
                    "valueMap": {
                      "OC": "Order closed",
                      "OP": "Open",
                      "OR": "Order"
                    }
                  },
                  {
                    "name": "workType",
                    "type": "_id_800004",
                    "valueMap": {
                      "RE": "Reinforcement",
                      "RO": "Road",
                      "WA": "Wall"
                    }
                  },
                  {
                    "name": "invoiceAddress",
                    "type": "_id_159"
                  },
                  {
                    "name": "invoiceAddress$_identifier"
                  },
                  {
                    "name": "phase",
                    "type": "_id_800003",
                    "valueMap": {
                      "AC": "Awarded a contract to",
                      "PR": "Project",
                      "TE": "Tender"
                    }
                  },
                  {
                    "name": "generateOrder",
                    "type": "_id_28"
                  },
                  {
                    "name": "changeProjectStatus",
                    "type": "_id_800002"
                  },
                  {
                    "name": "locationAddress",
                    "type": "_id_21"
                  },
                  {
                    "name": "locationAddress$_identifier"
                  },
                  {
                    "name": "priceList",
                    "type": "_id_19"
                  },
                  {
                    "name": "priceList$_identifier"
                  },
                  {
                    "name": "formOfPayment",
                    "type": "_id_195",
                    "valueMap": {
                      "1": "Wire Transfer",
                      "2": "Check",
                      "3": "Promissory Note",
                      "4": "Money Order",
                      "5": "Bank Deposit",
                      "B": "Cash",
                      "C": "Cash on Delivery",
                      "K": "Credit Card",
                      "P": "On Credit",
                      "R": "Bank Remittance",
                      "W": "Withholding"
                    }
                  },
                  {
                    "name": "invoiceToProject",
                    "type": "_id_20"
                  },
                  {
                    "name": "plannedPoAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "lastPlannedProposalDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "numberOfCopies",
                    "type": "_id_11"
                  },
                  {
                    "name": "accountNo",
                    "type": "_id_10"
                  },
                  {
                    "name": "plannedExpenses",
                    "type": "_id_22"
                  },
                  {
                    "name": "expensesMargin",
                    "type": "_id_22"
                  },
                  {
                    "name": "reinvoicedExpenses",
                    "type": "_id_22"
                  },
                  {
                    "name": "personInCharge",
                    "type": "_id_800093"
                  },
                  {
                    "name": "personInCharge$_identifier"
                  },
                  {
                    "name": "serviceCost",
                    "type": "_id_22"
                  },
                  {
                    "name": "serviceMargin",
                    "type": "_id_22"
                  },
                  {
                    "name": "serviceRevenue",
                    "type": "_id_22"
                  },
                  {
                    "name": "setProjectType",
                    "type": "_id_28"
                  },
                  {
                    "name": "startingDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "servicesProvidedCost",
                    "type": "_id_22"
                  },
                  {
                    "name": "outsourcedCost",
                    "type": "_id_22"
                  },
                  {
                    "name": "paymentMethod",
                    "type": "_id_19"
                  },
                  {
                    "name": "paymentMethod$_identifier"
                  },
                  {
                    "additional": true,
                    "name": "projectStatus",
                    "type": "_id_800002",
                    "valueMap": {
                      "OC": "Order closed",
                      "OP": "Open",
                      "OR": "Order"
                    }
                  },
                  {
                    "additional": true,
                    "name": "businessPartner$_identifier",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "searchKey",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "name",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "businessPartner$name",
                    "type": "_id_10"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_extraProperties": "projectStatus,businessPartner$_identifier,searchKey,name",
                    "adTabId": "187",
                    "columnName": "C_Project_ID",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier",
                    "IsSelectorItem": "true",
                    "targetProperty": "project"
                  }
                }
              },
              "defaultPopupFilterField": "searchKey",
              "displayField": "_identifier",
              "extraSearchFields": ["searchKey", "name"],
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 32,
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 28
              },
              "id": "8805B43A11F842698C397F4BFFF6D104",
              "inpColumnName": "inpcProjectId",
              "name": "project",
              "outFields": {},
              "outHiddenInputPrefix": "inpcProjectId",
              "pickListFields": [
                {
                  "name": "_identifier",
                  "title": " ",
                  "type": "text"
                }
              ],
              "popupTextMatchStyle": "substring",
              "refColumnName": "C_Project_ID",
              "selectorDefinitionId": "A35B6EC33A2243018915908AEB1B3F5E",
              "selectorGridFields": [
                {
                  "name": "searchKey",
                  "showHover": true,
                  "title": "Search Key",
                  "type": "_id_10"
                },
                {
                  "name": "name",
                  "showHover": true,
                  "title": "Name",
                  "type": "_id_10"
                },
                {
                  "filterOnKeypress": false,
                  "name": "projectStatus",
                  "showHover": true,
                  "title": "Project Status",
                  "type": "_id_800002",
                  "valueMap": {
                    "OC": "Order closed",
                    "OP": "Open",
                    "OR": "Order"
                  }
                },
                {
                  "displayField": "businessPartner$_identifier",
                  "name": "businessPartner",
                  "showHover": true,
                  "title": "Business Partner",
                  "type": "_id_800057"
                }
              ],
              "showSelectorGrid": true,
              "targetEntity": "Project",
              "textMatchStyle": "substring",
              "title": "Project",
              "type": "_id_800061",
              "valueField": "id"
            },
            {
              "columnName": "C_Costcenter_ID",
              "datasource": {
                "createClassName": "",
                "dataURL": "/etendo/org.openbravo.service.datasource/Costcenter",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "active",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  },
                  {
                    "name": "searchKey",
                    "type": "_id_10"
                  },
                  {
                    "name": "name",
                    "type": "_id_10"
                  },
                  {
                    "name": "description",
                    "type": "_id_10"
                  },
                  {
                    "name": "summaryLevel",
                    "type": "_id_20"
                  },
                  {
                    "additional": true,
                    "name": "searchKey",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "name",
                    "type": "_id_10"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_extraProperties": "searchKey,name",
                    "adTabId": "187",
                    "columnName": "C_Costcenter_ID",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier",
                    "IsSelectorItem": "true",
                    "targetProperty": "costcenter"
                  }
                }
              },
              "defaultPopupFilterField": "name",
              "displayField": "_identifier",
              "extraSearchFields": [],
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 32,
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 29
              },
              "id": "A95DE4439AE24A95AD6C820B688B3981",
              "inpColumnName": "inpcCostcenterId",
              "name": "costcenter",
              "outFields": {},
              "outHiddenInputPrefix": "inpcCostcenterId",
              "pickListFields": [
                {
                  "name": "_identifier",
                  "title": " ",
                  "type": "text"
                }
              ],
              "popupTextMatchStyle": "substring",
              "refColumnName": "C_Costcenter_ID",
              "selectorDefinitionId": "B8321631F57E463EB617289E936BAF3A",
              "selectorGridFields": [
                {
                  "name": "searchKey",
                  "showHover": true,
                  "title": "Search Key",
                  "type": "_id_10"
                },
                {
                  "name": "name",
                  "showHover": true,
                  "title": "Name",
                  "type": "_id_10"
                }
              ],
              "showSelectorGrid": true,
              "targetEntity": "Costcenter",
              "textMatchStyle": "substring",
              "title": "Cost Center",
              "type": "_id_DEE6B917B36D4648B2DA729FC2872CF4",
              "valueField": "id"
            },
            {
              "columnName": "A_Asset_ID",
              "datasource": {
                "createClassName": "",
                "dataURL": "/etendo/org.openbravo.service.datasource/FinancialMgmtAsset",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "active",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  },
                  {
                    "name": "searchKey",
                    "type": "_id_10"
                  },
                  {
                    "name": "name",
                    "type": "_id_10"
                  },
                  {
                    "name": "description",
                    "type": "_id_10"
                  },
                  {
                    "name": "helpComment",
                    "type": "_id_14"
                  },
                  {
                    "name": "assetCategory",
                    "type": "_id_19"
                  },
                  {
                    "name": "assetCategory$_identifier"
                  },
                  {
                    "name": "product",
                    "type": "_id_800011"
                  },
                  {
                    "name": "product$_identifier"
                  },
                  {
                    "name": "serialNo",
                    "type": "_id_10"
                  },
                  {
                    "name": "lotName",
                    "type": "_id_10"
                  },
                  {
                    "name": "versionNo",
                    "type": "_id_10"
                  },
                  {
                    "name": "expirationDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "inServiceDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "owned",
                    "type": "_id_20"
                  },
                  {
                    "name": "assetDepreciationDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "usableLifeYears",
                    "type": "_id_11"
                  },
                  {
                    "name": "usableLifeMonths",
                    "type": "_id_11"
                  },
                  {
                    "name": "lifeUse",
                    "type": "_id_11"
                  },
                  {
                    "name": "useUnits",
                    "type": "_id_11"
                  },
                  {
                    "name": "disposed",
                    "type": "_id_20"
                  },
                  {
                    "name": "assetDisposalDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "inPossession",
                    "type": "_id_20"
                  },
                  {
                    "name": "locationComment",
                    "type": "_id_10"
                  },
                  {
                    "name": "storageBin",
                    "type": "_id_19"
                  },
                  {
                    "name": "storageBin$_identifier"
                  },
                  {
                    "name": "businessPartner",
                    "type": "_id_800057"
                  },
                  {
                    "name": "businessPartner$_identifier"
                  },
                  {
                    "name": "partnerAddress",
                    "type": "_id_19"
                  },
                  {
                    "name": "partnerAddress$_identifier"
                  },
                  {
                    "name": "locationAddress",
                    "type": "_id_21"
                  },
                  {
                    "name": "locationAddress$_identifier"
                  },
                  {
                    "name": "processNow",
                    "type": "_id_28"
                  },
                  {
                    "name": "depreciate",
                    "type": "_id_20"
                  },
                  {
                    "name": "fullyDepreciated",
                    "type": "_id_20"
                  },
                  {
                    "name": "userContact",
                    "type": "_id_19"
                  },
                  {
                    "name": "userContact$_identifier"
                  },
                  {
                    "name": "depreciationEndDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "depreciationStartDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "annualDepreciation",
                    "type": "_id_22"
                  },
                  {
                    "name": "assetValue",
                    "type": "_id_12"
                  },
                  {
                    "name": "currency",
                    "type": "_id_19"
                  },
                  {
                    "name": "currency$_identifier"
                  },
                  {
                    "name": "cancellationDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "purchaseDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "attributeSetValue",
                    "type": "_id_35"
                  },
                  {
                    "name": "attributeSetValue$_identifier"
                  },
                  {
                    "name": "residualAssetValue",
                    "type": "_id_12"
                  },
                  {
                    "name": "acctvalueamt",
                    "type": "_id_22"
                  },
                  {
                    "name": "depreciationType",
                    "type": "_id_800040",
                    "valueMap": {
                      "LI": "Linear"
                    }
                  },
                  {
                    "name": "depreciationAmt",
                    "type": "_id_12"
                  },
                  {
                    "name": "amortize",
                    "type": "_id_800041",
                    "valueMap": {
                      "MO": "Monthly",
                      "YE": "Yearly"
                    }
                  },
                  {
                    "name": "documentNo",
                    "type": "_id_10"
                  },
                  {
                    "name": "processed",
                    "type": "_id_800042",
                    "valueMap": {
                      "N": "Create Amortization",
                      "Y": "Recalculate Amortization"
                    }
                  },
                  {
                    "name": "profit",
                    "type": "_id_22"
                  },
                  {
                    "name": "quantity",
                    "type": "_id_29"
                  },
                  {
                    "name": "calculateType",
                    "type": "_id_800068",
                    "valueMap": {
                      "PE": "Percentage",
                      "TI": "Time"
                    }
                  },
                  {
                    "name": "depreciatedPlan",
                    "type": "_id_12"
                  },
                  {
                    "name": "previouslyDepreciatedAmt",
                    "type": "_id_12"
                  },
                  {
                    "name": "depreciatedValue",
                    "type": "_id_12"
                  },
                  {
                    "name": "summaryLevel",
                    "type": "_id_20"
                  },
                  {
                    "name": "project",
                    "type": "_id_800061"
                  },
                  {
                    "name": "project$_identifier"
                  },
                  {
                    "name": "static",
                    "type": "_id_20"
                  },
                  {
                    "name": "everyMonthIs30Days",
                    "type": "_id_20"
                  },
                  {
                    "name": "processAsset",
                    "type": "_id_800042",
                    "valueMap": {
                      "N": "Create Amortization",
                      "Y": "Recalculate Amortization"
                    }
                  },
                  {
                    "additional": true,
                    "name": "name",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "searchKey",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "businessPartner$name",
                    "type": "_id_10"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_extraProperties": "name,searchKey",
                    "adTabId": "187",
                    "columnName": "A_Asset_ID",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier",
                    "IsSelectorItem": "true",
                    "targetProperty": "asset"
                  }
                }
              },
              "defaultPopupFilterField": "name",
              "displayField": "_identifier",
              "extraSearchFields": [],
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 32,
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 30
              },
              "id": "B84046BFFE43473AA6523A84B7534307",
              "inpColumnName": "inpaAssetId",
              "name": "asset",
              "outFields": {},
              "outHiddenInputPrefix": "inpaAssetId",
              "pickListFields": [
                {
                  "name": "_identifier",
                  "title": " ",
                  "type": "text"
                }
              ],
              "popupTextMatchStyle": "substring",
              "refColumnName": "A_Asset_ID",
              "selectorDefinitionId": "E65052A724B3451CA643A0CC355CEA40",
              "selectorGridFields": [
                {
                  "name": "searchKey",
                  "showHover": true,
                  "title": "Search Key",
                  "type": "_id_10"
                },
                {
                  "name": "name",
                  "showHover": true,
                  "title": "Name",
                  "type": "_id_10"
                }
              ],
              "showSelectorGrid": true,
              "targetEntity": "FinancialMgmtAsset",
              "textMatchStyle": "startsWith",
              "title": "Asset",
              "type": "_id_444F3B4F45544B9CA45E4035D49C1176",
              "valueField": "id"
            },
            {
              "columnName": "User1_ID",
              "datasource": {
                "createClassName": "",
                "dataURL": "/etendo/org.openbravo.service.datasource/UserDimension1",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "active",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  },
                  {
                    "name": "searchKey",
                    "type": "_id_10"
                  },
                  {
                    "name": "name",
                    "type": "_id_10"
                  },
                  {
                    "name": "description",
                    "type": "_id_10"
                  },
                  {
                    "name": "summaryLevel",
                    "type": "_id_20"
                  },
                  {
                    "additional": true,
                    "name": "searchKey",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "name",
                    "type": "_id_10"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_extraProperties": "searchKey,name",
                    "adTabId": "187",
                    "columnName": "User1_ID",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier",
                    "IsSelectorItem": "true",
                    "targetProperty": "stDimension"
                  }
                }
              },
              "defaultPopupFilterField": "name",
              "displayField": "_identifier",
              "extraSearchFields": [],
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 32,
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 31
              },
              "id": "4C130F137CB840559B2B372342B535AA",
              "inpColumnName": "inpuser1Id",
              "name": "stDimension",
              "outFields": {},
              "outHiddenInputPrefix": "inpuser1Id",
              "pickListFields": [
                {
                  "name": "_identifier",
                  "title": " ",
                  "type": "text"
                }
              ],
              "popupTextMatchStyle": "substring",
              "refColumnName": "User1_ID",
              "selectorDefinitionId": "814758DD755642E9BF38BD2E5AD713EC",
              "selectorGridFields": [
                {
                  "name": "searchKey",
                  "showHover": true,
                  "title": "Search Key",
                  "type": "_id_10"
                },
                {
                  "name": "name",
                  "showHover": true,
                  "title": "Name",
                  "type": "_id_10"
                }
              ],
              "showSelectorGrid": true,
              "targetEntity": "UserDimension1",
              "textMatchStyle": "substring",
              "title": "1st Dimension",
              "type": "_id_0E0D1661E18E4E05A118785A7CF146B8",
              "valueField": "id"
            },
            {
              "columnName": "User2_ID",
              "datasource": {
                "createClassName": "",
                "dataURL": "/etendo/org.openbravo.service.datasource/UserDimension2",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "active",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  },
                  {
                    "name": "searchKey",
                    "type": "_id_10"
                  },
                  {
                    "name": "name",
                    "type": "_id_10"
                  },
                  {
                    "name": "description",
                    "type": "_id_10"
                  },
                  {
                    "name": "summaryLevel",
                    "type": "_id_20"
                  },
                  {
                    "additional": true,
                    "name": "name",
                    "type": "_id_10"
                  },
                  {
                    "additional": true,
                    "name": "searchKey",
                    "type": "_id_10"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_extraProperties": "name,searchKey",
                    "adTabId": "187",
                    "columnName": "User2_ID",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier",
                    "IsSelectorItem": "true",
                    "targetProperty": "ndDimension"
                  }
                }
              },
              "defaultPopupFilterField": "name",
              "displayField": "_identifier",
              "extraSearchFields": [],
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 32,
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 32
              },
              "id": "C6B5C067950E40588ED89D0384930096",
              "inpColumnName": "inpuser2Id",
              "name": "ndDimension",
              "outFields": {},
              "outHiddenInputPrefix": "inpuser2Id",
              "pickListFields": [
                {
                  "name": "_identifier",
                  "title": " ",
                  "type": "text"
                }
              ],
              "popupTextMatchStyle": "substring",
              "refColumnName": "User2_ID",
              "selectorDefinitionId": "BD1DA40E134A42B9889B529302A96871",
              "selectorGridFields": [
                {
                  "name": "searchKey",
                  "showHover": true,
                  "title": "Search Key",
                  "type": "_id_10"
                },
                {
                  "name": "name",
                  "showHover": true,
                  "title": "Name",
                  "type": "_id_10"
                }
              ],
              "showSelectorGrid": true,
              "targetEntity": "UserDimension2",
              "textMatchStyle": "substring",
              "title": "2nd Dimension",
              "type": "_id_1850A5390D97470EBB35A3A5F43AB533",
              "valueField": "id"
            },
            {
              "defaultValue": "Audit",
              "itemIds": ["creationDate", "createdBy", "updated", "updatedBy"],
              "name": "1000100001",
              "personalizable": false,
              "title": "Audit",
              "type": "OBAuditSectionItem"
            },
            {
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "creationDate",
              "personalizable": false,
              "title": "Creation Date",
              "type": "_id_16",
              "updatable": false
            },
            {
              "disabled": true,
              "displayField": "createdBy$_identifier",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "fkField": true,
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "createdBy",
              "personalizable": false,
              "targetEntity": "User",
              "title": "Created By",
              "type": "_id_30",
              "updatable": false
            },
            {
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "updated",
              "personalizable": false,
              "title": "Updated",
              "type": "_id_16",
              "updatable": false
            },
            {
              "disabled": true,
              "displayField": "updatedBy$_identifier",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "fkField": true,
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "updatedBy",
              "personalizable": false,
              "targetEntity": "User",
              "title": "Updated By",
              "type": "_id_30",
              "updatable": false
            },
            {
              "name": "_notes_",
              "personalizable": false,
              "type": "OBNoteSectionItem"
            },
            {
              "name": "_notes_Canvas",
              "personalizable": false,
              "type": "OBNoteCanvasItem"
            },
            {
              "name": "_linkedItems_",
              "personalizable": false,
              "type": "OBLinkedItemSectionItem"
            },
            {
              "name": "_linkedItems_Canvas",
              "personalizable": false,
              "type": "OBLinkedItemCanvasItem"
            },
            {
              "name": "_attachments_",
              "personalizable": false,
              "type": "OBAttachmentsSectionItem"
            },
            {
              "name": "_attachments_Canvas",
              "personalizable": false,
              "type": "OBAttachmentCanvasItem"
            },
            {
              "columnName": "QtyInvoiced",
              "disabled": true,
              "displayed": false,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 21
              },
              "inpColumnName": "inpqtyinvoiced",
              "name": "invoicedQuantity",
              "required": true,
              "title": "Invoiced Quantity",
              "type": "_id_29",
              "updatable": false
            },
            {
              "columnName": "QtyDelivered",
              "disabled": true,
              "displayed": false,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 22
              },
              "inpColumnName": "inpqtydelivered",
              "name": "deliveredQuantity",
              "required": true,
              "title": "Delivered Quantity",
              "type": "_id_29",
              "updatable": false
            },
            {
              "columnName": "SO_Res_Status",
              "disabled": true,
              "displayed": false,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "displaylength": 60,
                "filterOnKeypress": false,
                "length": 60,
                "selectOnClick": true,
                "showHover": true,
                "showIf": "false",
                "sort": 24
              },
              "inpColumnName": "inpsoResStatus",
              "name": "reservationStatus",
              "title": "Reservation Status",
              "type": "_id_C3C19DE8AB3B42E78748E20D986FBBC9"
            }
          ],
          "hasChildTabs": true,
          "iconToolbarButtons": [],
          "initialPropertyToColumns": [
            {
              "dbColumn": "M_Inoutline_ID",
              "inpColumn": "inpmInoutlineId",
              "property": "goodsShipmentLine",
              "type": "_id_224C53E343404771A44494C2AD51DAF3"
            },
            {
              "dbColumn": "C_Return_Reason_ID",
              "inpColumn": "inpcReturnReasonId",
              "property": "returnReason",
              "type": "_id_19"
            },
            {
              "dbColumn": "QtyInvoiced",
              "inpColumn": "inpqtyinvoiced",
              "property": "invoicedQuantity",
              "type": "_id_29"
            },
            {
              "dbColumn": "DateOrdered",
              "inpColumn": "inpdateordered",
              "property": "orderDate",
              "sessionProperty": true,
              "type": "_id_15"
            },
            {
              "dbColumn": "DatePromised",
              "inpColumn": "inpdatepromised",
              "property": "scheduledDeliveryDate",
              "sessionProperty": true,
              "type": "_id_15"
            },
            {
              "dbColumn": "M_Warehouse_ID",
              "inpColumn": "inpmWarehouseId",
              "property": "warehouse",
              "sessionProperty": true,
              "type": "_id_197"
            },
            {
              "dbColumn": "QtyReserved",
              "inpColumn": "inpqtyreserved",
              "property": "reservedQuantity",
              "type": "_id_29"
            },
            {
              "dbColumn": "M_Shipper_ID",
              "inpColumn": "inpmShipperId",
              "property": "shippingCompany",
              "sessionProperty": true,
              "type": "_id_19"
            },
            {
              "dbColumn": "C_BPartner_ID",
              "inpColumn": "inpcBpartnerId",
              "property": "businessPartner",
              "type": "_id_800057"
            },
            {
              "dbColumn": "DirectShip",
              "inpColumn": "inpdirectship",
              "property": "directShipment",
              "type": "_id_20"
            },
            {
              "dbColumn": "FreightAmt",
              "inpColumn": "inpfreightamt",
              "property": "freightAmount",
              "type": "_id_12"
            },
            {
              "dbColumn": "C_BPartner_Location_ID",
              "inpColumn": "inpcBpartnerLocationId",
              "property": "partnerAddress",
              "sessionProperty": true,
              "type": "_id_19"
            },
            {
              "dbColumn": "CANCELPRICEAD",
              "inpColumn": "inpcancelpricead",
              "property": "cancelPriceAdjustment",
              "type": "_id_20"
            },
            {
              "dbColumn": "M_Product_Uom_Id",
              "inpColumn": "inpmProductUomId",
              "property": "orderUOM",
              "type": "_id_101787D75B4E4D7280C75D9802FE5FB6"
            },
            {
              "dbColumn": "QuantityOrder",
              "inpColumn": "inpquantityorder",
              "property": "orderQuantity",
              "type": "_id_29"
            },
            {
              "dbColumn": "grosspricestd",
              "inpColumn": "inpgrosspricestd",
              "property": "baseGrossUnitPrice",
              "type": "_id_800008"
            },
            {
              "dbColumn": "PriceStd",
              "inpColumn": "inppricestd",
              "property": "standardPrice",
              "type": "_id_800008"
            },
            {
              "dbColumn": "Iseditlinenetamt",
              "inpColumn": "inpiseditlinenetamt",
              "property": "editLineAmount",
              "type": "_id_20"
            },
            {
              "dbColumn": "SO_Res_Status",
              "inpColumn": "inpsoResStatus",
              "property": "reservationStatus",
              "type": "_id_C3C19DE8AB3B42E78748E20D986FBBC9"
            },
            {
              "dbColumn": "Manage_Reservation",
              "inpColumn": "inpmanageReservation",
              "property": "manageReservation",
              "type": "_id_28"
            },
            {
              "dbColumn": "Explode",
              "inpColumn": "inpexplode",
              "property": "explode",
              "type": "_id_28"
            },
            {
              "dbColumn": "BOM_Parent_ID",
              "inpColumn": "inpbomParentId",
              "property": "bOMParent",
              "type": "_id_800063"
            },
            {
              "dbColumn": "Relate_Orderline",
              "inpColumn": "inprelateOrderline",
              "property": "selectOrderLine",
              "type": "_id_28"
            },
            {
              "dbColumn": "C_OrderLine_ID",
              "inpColumn": "inpcOrderlineId",
              "property": "id",
              "type": "_id_13"
            },
            {
              "dbColumn": "AD_Client_ID",
              "inpColumn": "inpadClientId",
              "property": "client",
              "sessionProperty": true,
              "type": "_id_19"
            },
            {
              "dbColumn": "IsActive",
              "inpColumn": "inpisactive",
              "property": "active",
              "type": "_id_20"
            },
            {
              "dbColumn": "C_Order_ID",
              "inpColumn": "inpcOrderId",
              "property": "salesOrder",
              "sessionProperty": true,
              "type": "_id_800062"
            },
            {
              "dbColumn": "DateDelivered",
              "inpColumn": "inpdatedelivered",
              "property": "dateDelivered",
              "type": "_id_15"
            },
            {
              "dbColumn": "DateInvoiced",
              "inpColumn": "inpdateinvoiced",
              "property": "invoiceDate",
              "type": "_id_15"
            },
            {
              "dbColumn": "C_Currency_ID",
              "inpColumn": "inpcCurrencyId",
              "property": "currency",
              "sessionProperty": true,
              "type": "_id_19"
            },
            {
              "dbColumn": "ChargeAmt",
              "inpColumn": "inpchargeamt",
              "property": "chargeAmount",
              "type": "_id_12"
            },
            {
              "dbColumn": "C_Charge_ID",
              "inpColumn": "inpcChargeId",
              "property": "charge",
              "type": "_id_19"
            },
            {
              "dbColumn": "PriceLimit",
              "inpColumn": "inppricelimit",
              "property": "priceLimit",
              "type": "_id_800008"
            },
            {
              "dbColumn": "S_ResourceAssignment_ID",
              "inpColumn": "inpsResourceassignmentId",
              "property": "resourceAssignment",
              "type": "_id_33"
            },
            {
              "dbColumn": "Ref_OrderLine_ID",
              "inpColumn": "inprefOrderlineId",
              "property": "sOPOReference",
              "type": "_id_30"
            },
            {
              "dbColumn": "C_Order_Discount_ID",
              "inpColumn": "inpcOrderDiscountId",
              "property": "orderDiscount",
              "type": "_id_19"
            },
            {
              "dbColumn": "M_Offer_ID",
              "inpColumn": "inpmOfferId",
              "property": "priceAdjustment",
              "type": "_id_8238E1DF040B4641877766194CD1EF33"
            },
            {
              "dbColumn": "IsDescription",
              "inpColumn": "inpisdescription",
              "property": "descriptionOnly",
              "type": "_id_20"
            },
            {
              "dbColumn": "Manage_Prereservation",
              "inpColumn": "inpmanagePrereservation",
              "property": "managePrereservation",
              "type": "_id_28"
            },
            {
              "dbColumn": "C_OrderLine_ID",
              "inpColumn": "C_OrderLine_ID",
              "property": "id",
              "sessionProperty": true,
              "type": "_id_13"
            }
          ],
          "isDeleteableTable": true,
          "mapping250": "/SalesOrder/Lines",
          "moduleId": "0",
          "notesDataSource": {
            "createClassName": "",
            "dataURL": "/etendo/org.openbravo.service.datasource/090A37D22E61FE94012E621729090048",
            "fields": [
              {
                "name": "id",
                "primaryKey": true,
                "type": "_id_13"
              },
              {
                "name": "client",
                "type": "_id_19"
              },
              {
                "name": "client$_identifier"
              },
              {
                "name": "organization",
                "type": "_id_19"
              },
              {
                "name": "organization$_identifier"
              },
              {
                "name": "table",
                "type": "_id_19"
              },
              {
                "name": "table$_identifier"
              },
              {
                "name": "record",
                "type": "_id_10"
              },
              {
                "name": "note",
                "type": "_id_14"
              },
              {
                "name": "isactive",
                "type": "_id_20"
              },
              {
                "name": "creationDate",
                "type": "_id_16"
              },
              {
                "name": "createdBy",
                "type": "_id_30"
              },
              {
                "name": "createdBy$_identifier"
              },
              {
                "name": "updated",
                "type": "_id_16"
              },
              {
                "name": "updatedBy",
                "type": "_id_30"
              },
              {
                "name": "updatedBy$_identifier"
              }
            ],
            "requestProperties": {
              "params": {
                "Constants_FIELDSEPARATOR": "$",
                "Constants_IDENTIFIER": "_identifier"
              }
            }
          },
          "parentProperty": "salesOrder",
          "showCloneButton": false,
          "showParentButtons": true,
          "standardProperties": {
            "inpkeyColumnId": "C_OrderLine_ID",
            "inpKeyName": "inpcOrderlineId",
            "inpTabId": "187",
            "inpTableId": "260",
            "inpwindowId": "143",
            "keyColumnName": "C_OrderLine_ID",
            "keyProperty": "id",
            "keyPropertyType": "_id_13"
          },
          "statusBarFields": [
            "invoicedQuantity",
            "deliveredQuantity",
            "reservationStatus"
          ],
          "tabId": "187",
          "tabTitle": "Lines",
          "viewForm": {
            "clone": "OB.ViewFormProperties"
          },
          "viewGrid": {
            "allowSummaryFunctions": true,
            "filterClause": false,
            "orderByClause": "lineNo",
            "requiredGridProperties": [
              "id",
              "client",
              "organization",
              "updatedBy",
              "updated",
              "creationDate",
              "createdBy",
              "salesOrder",
              "lineNo",
              "lineNetAmount",
              "manageReservation",
              "explode",
              "selectOrderLine",
              "orderedQuantity",
              "deliveredQuantity",
              "explode",
              "orderUOM",
              "replacedorderline",
              "quotationLine",
              "salesOrder",
              "product",
              "uOM",
              "attributeSetValue",
              "orderDate",
              "scheduledDeliveryDate",
              "warehouse",
              "shippingCompany",
              "partnerAddress",
              "client",
              "salesOrder",
              "currency",
              "product",
              "product",
              "salesOrder",
              "salesOrder",
              "product",
              "salesOrder",
              "salesOrder",
              "product",
              "id",
              "product",
              "tax",
              "product",
              "product",
              "product",
              "product",
              "product",
              "salesOrder"
            ],
            "uiPattern": "STD"
          }
        },
        {
          "actionToolbarButtons": [],
          "askToCloneChildren": true,
          "buttonsHaveSessionLogic": false,
          "dataSource": {
            "createClassName": "OBViewDataSource",
            "dataURL": "/etendo/org.openbravo.service.datasource/OrderDiscount",
            "fields": [
              {
                "name": "id",
                "primaryKey": true,
                "type": "_id_13"
              },
              {
                "name": "client",
                "type": "_id_19"
              },
              {
                "name": "client$_identifier"
              },
              {
                "name": "organization",
                "type": "_id_19"
              },
              {
                "name": "organization$_identifier"
              },
              {
                "name": "active",
                "type": "_id_20"
              },
              {
                "name": "creationDate",
                "type": "_id_16"
              },
              {
                "name": "createdBy",
                "type": "_id_30"
              },
              {
                "name": "createdBy$_identifier"
              },
              {
                "name": "updated",
                "type": "_id_16"
              },
              {
                "name": "updatedBy",
                "type": "_id_30"
              },
              {
                "name": "updatedBy$_identifier"
              },
              {
                "name": "salesOrder",
                "type": "_id_30"
              },
              {
                "name": "salesOrder$_identifier"
              },
              {
                "name": "discount",
                "type": "_id_19"
              },
              {
                "name": "discount$_identifier"
              },
              {
                "name": "lineNo",
                "type": "_id_11"
              },
              {
                "name": "cascade",
                "type": "_id_20"
              }
            ],
            "requestProperties": {
              "params": {
                "_className": "OBViewDataSource",
                "Constants_FIELDSEPARATOR": "$",
                "Constants_IDENTIFIER": "_identifier"
              }
            }
          },
          "entity": "OrderDiscount",
          "fields": [
            {
              "columnName": "Line",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 1
              },
              "hasDefaultValue": true,
              "id": "1011100007",
              "inpColumnName": "inpline",
              "name": "lineNo",
              "required": true,
              "title": "Line No.",
              "type": "_id_11"
            },
            {
              "columnName": "C_Discount_ID",
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 12,
                "editorProps": {
                  "displayField": "_identifier",
                  "valueField": "id"
                },
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "sort": 2
              },
              "id": "1011100002",
              "inpColumnName": "inpcDiscountId",
              "name": "discount",
              "refColumnName": "C_Discount_ID",
              "required": true,
              "targetEntity": "PricingDiscount",
              "title": "Basic Discount",
              "type": "_id_19"
            },
            {
              "columnName": "Cascade",
              "gridProps": {
                "autoFitWidth": false,
                "canFilter": true,
                "canGroupBy": false,
                "canSort": true,
                "editorProps": {
                  "showLabel": false,
                  "showTitle": false
                },
                "selectOnClick": true,
                "showHover": true,
                "sort": 3,
                "width": "*",
                "yesNo": true
              },
              "hasDefaultValue": true,
              "id": "1011100005",
              "inpColumnName": "inpcascade",
              "name": "cascade",
              "overflow": "visible",
              "title": "Cascade",
              "type": "_id_20",
              "width": 1
            },
            {
              "columnName": "Isactive",
              "gridProps": {
                "autoFitWidth": false,
                "canFilter": true,
                "canGroupBy": false,
                "canSort": true,
                "editorProps": {
                  "showLabel": false,
                  "showTitle": false
                },
                "selectOnClick": true,
                "showHover": true,
                "sort": 4,
                "width": "*",
                "yesNo": true
              },
              "hasDefaultValue": true,
              "id": "1011100006",
              "inpColumnName": "inpisactive",
              "name": "active",
              "overflow": "visible",
              "title": "Active",
              "type": "_id_20",
              "width": 1
            },
            {
              "defaultValue": "Audit",
              "itemIds": ["creationDate", "createdBy", "updated", "updatedBy"],
              "name": "1000100001",
              "personalizable": false,
              "title": "Audit",
              "type": "OBAuditSectionItem"
            },
            {
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "creationDate",
              "personalizable": false,
              "title": "Creation Date",
              "type": "_id_16",
              "updatable": false
            },
            {
              "disabled": true,
              "displayField": "createdBy$_identifier",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "fkField": true,
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "createdBy",
              "personalizable": false,
              "targetEntity": "User",
              "title": "Created By",
              "type": "_id_30",
              "updatable": false
            },
            {
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "updated",
              "personalizable": false,
              "title": "Updated",
              "type": "_id_16",
              "updatable": false
            },
            {
              "disabled": true,
              "displayField": "updatedBy$_identifier",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "fkField": true,
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "updatedBy",
              "personalizable": false,
              "targetEntity": "User",
              "title": "Updated By",
              "type": "_id_30",
              "updatable": false
            },
            {
              "name": "_notes_",
              "personalizable": false,
              "type": "OBNoteSectionItem"
            },
            {
              "name": "_notes_Canvas",
              "personalizable": false,
              "type": "OBNoteCanvasItem"
            },
            {
              "name": "_linkedItems_",
              "personalizable": false,
              "type": "OBLinkedItemSectionItem"
            },
            {
              "name": "_linkedItems_Canvas",
              "personalizable": false,
              "type": "OBLinkedItemCanvasItem"
            },
            {
              "name": "_attachments_",
              "personalizable": false,
              "type": "OBAttachmentsSectionItem"
            },
            {
              "name": "_attachments_Canvas",
              "personalizable": false,
              "type": "OBAttachmentCanvasItem"
            }
          ],
          "iconToolbarButtons": [],
          "initialPropertyToColumns": [
            {
              "dbColumn": "AD_Client_ID",
              "inpColumn": "inpadClientId",
              "property": "client",
              "sessionProperty": true,
              "type": "_id_19"
            },
            {
              "dbColumn": "AD_Org_ID",
              "inpColumn": "inpadOrgId",
              "property": "organization",
              "sessionProperty": true,
              "type": "_id_19"
            },
            {
              "dbColumn": "C_Order_Discount_ID",
              "inpColumn": "inpcOrderDiscountId",
              "property": "id",
              "type": "_id_13"
            },
            {
              "dbColumn": "C_Order_ID",
              "inpColumn": "inpcOrderId",
              "property": "salesOrder",
              "type": "_id_30"
            },
            {
              "dbColumn": "C_Order_Discount_ID",
              "inpColumn": "C_Order_Discount_ID",
              "property": "id",
              "sessionProperty": true,
              "type": "_id_13"
            }
          ],
          "isDeleteableTable": true,
          "mapping250": "/SalesOrder/BasicDiscounts",
          "moduleId": "0",
          "notesDataSource": {
            "createClassName": "",
            "dataURL": "/etendo/org.openbravo.service.datasource/090A37D22E61FE94012E621729090048",
            "fields": [
              {
                "name": "id",
                "primaryKey": true,
                "type": "_id_13"
              },
              {
                "name": "client",
                "type": "_id_19"
              },
              {
                "name": "client$_identifier"
              },
              {
                "name": "organization",
                "type": "_id_19"
              },
              {
                "name": "organization$_identifier"
              },
              {
                "name": "table",
                "type": "_id_19"
              },
              {
                "name": "table$_identifier"
              },
              {
                "name": "record",
                "type": "_id_10"
              },
              {
                "name": "note",
                "type": "_id_14"
              },
              {
                "name": "isactive",
                "type": "_id_20"
              },
              {
                "name": "creationDate",
                "type": "_id_16"
              },
              {
                "name": "createdBy",
                "type": "_id_30"
              },
              {
                "name": "createdBy$_identifier"
              },
              {
                "name": "updated",
                "type": "_id_16"
              },
              {
                "name": "updatedBy",
                "type": "_id_30"
              },
              {
                "name": "updatedBy$_identifier"
              }
            ],
            "potentiallyShared": true,
            "requestProperties": {
              "params": {
                "Constants_FIELDSEPARATOR": "$",
                "Constants_IDENTIFIER": "_identifier"
              }
            }
          },
          "parentProperty": "salesOrder",
          "showCloneButton": false,
          "showParentButtons": true,
          "standardProperties": {
            "inpkeyColumnId": "C_Order_Discount_ID",
            "inpKeyName": "inpcOrderDiscountId",
            "inpTabId": "1011100000",
            "inpTableId": "1011100000",
            "inpwindowId": "143",
            "keyColumnName": "C_Order_Discount_ID",
            "keyProperty": "id",
            "keyPropertyType": "_id_13"
          },
          "statusBarFields": [],
          "tabId": "1011100000",
          "tabTitle": "Basic Discounts",
          "viewForm": {},
          "viewGrid": {
            "allowSummaryFunctions": true,
            "filterClause": false,
            "orderByClause": "lineNo",
            "requiredGridProperties": [
              "id",
              "client",
              "organization",
              "updatedBy",
              "updated",
              "creationDate",
              "createdBy",
              "salesOrder",
              "salesOrder",
              "client",
              "organization",
              "salesOrder"
            ],
            "uiPattern": "STD"
          }
        },
        {
          "actionToolbarButtons": [],
          "askToCloneChildren": true,
          "buttonsHaveSessionLogic": false,
          "dataSource": {
            "createClassName": "OBViewDataSource",
            "dataURL": "/etendo/org.openbravo.service.datasource/OrderTax",
            "fields": [
              {
                "name": "id",
                "primaryKey": true,
                "type": "_id_13"
              },
              {
                "name": "salesOrder",
                "type": "_id_800062"
              },
              {
                "name": "salesOrder$_identifier"
              },
              {
                "name": "tax",
                "type": "_id_19"
              },
              {
                "name": "tax$_identifier"
              },
              {
                "name": "client",
                "type": "_id_19"
              },
              {
                "name": "client$_identifier"
              },
              {
                "name": "organization",
                "type": "_id_19"
              },
              {
                "name": "organization$_identifier"
              },
              {
                "name": "active",
                "type": "_id_20"
              },
              {
                "name": "creationDate",
                "type": "_id_16"
              },
              {
                "name": "createdBy",
                "type": "_id_30"
              },
              {
                "name": "createdBy$_identifier"
              },
              {
                "name": "updated",
                "type": "_id_16"
              },
              {
                "name": "updatedBy",
                "type": "_id_30"
              },
              {
                "name": "updatedBy$_identifier"
              },
              {
                "name": "taxableAmount",
                "type": "_id_12"
              },
              {
                "name": "taxAmount",
                "type": "_id_12"
              },
              {
                "name": "lineNo",
                "type": "_id_11"
              }
            ],
            "requestProperties": {
              "params": {
                "_className": "OBViewDataSource",
                "Constants_FIELDSEPARATOR": "$",
                "Constants_IDENTIFIER": "_identifier"
              }
            }
          },
          "entity": "OrderTax",
          "fields": [
            {
              "columnName": "Line",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 1
              },
              "hasDefaultValue": true,
              "id": "803562",
              "inpColumnName": "inpline",
              "name": "lineNo",
              "title": "Line No.",
              "type": "_id_11"
            },
            {
              "columnName": "C_Tax_ID",
              "firstFocusedField": true,
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 44,
                "editorProps": {
                  "displayField": "_identifier",
                  "valueField": "id"
                },
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "sort": 2
              },
              "id": "2277",
              "inpColumnName": "inpcTaxId",
              "name": "tax",
              "refColumnName": "C_Tax_ID",
              "required": true,
              "targetEntity": "FinancialMgmtTaxRate",
              "title": "Tax",
              "type": "_id_19",
              "updatable": false
            },
            {
              "columnName": "TaxAmt",
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 3
              },
              "id": "2894",
              "inpColumnName": "inptaxamt",
              "name": "taxAmount",
              "required": true,
              "title": "Tax Amount",
              "type": "_id_12",
              "updatable": false
            },
            {
              "columnName": "TaxBaseAmt",
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 4
              },
              "hasDefaultValue": true,
              "id": "2895",
              "inpColumnName": "inptaxbaseamt",
              "name": "taxableAmount",
              "required": true,
              "title": "Taxable Amount",
              "type": "_id_12",
              "updatable": false
            },
            {
              "defaultValue": "Audit",
              "itemIds": ["creationDate", "createdBy", "updated", "updatedBy"],
              "name": "1000100001",
              "personalizable": false,
              "title": "Audit",
              "type": "OBAuditSectionItem"
            },
            {
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "creationDate",
              "personalizable": false,
              "title": "Creation Date",
              "type": "_id_16",
              "updatable": false
            },
            {
              "disabled": true,
              "displayField": "createdBy$_identifier",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "fkField": true,
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "createdBy",
              "personalizable": false,
              "targetEntity": "User",
              "title": "Created By",
              "type": "_id_30",
              "updatable": false
            },
            {
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "updated",
              "personalizable": false,
              "title": "Updated",
              "type": "_id_16",
              "updatable": false
            },
            {
              "disabled": true,
              "displayField": "updatedBy$_identifier",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "fkField": true,
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "updatedBy",
              "personalizable": false,
              "targetEntity": "User",
              "title": "Updated By",
              "type": "_id_30",
              "updatable": false
            },
            {
              "name": "_notes_",
              "personalizable": false,
              "type": "OBNoteSectionItem"
            },
            {
              "name": "_notes_Canvas",
              "personalizable": false,
              "type": "OBNoteCanvasItem"
            },
            {
              "name": "_linkedItems_",
              "personalizable": false,
              "type": "OBLinkedItemSectionItem"
            },
            {
              "name": "_linkedItems_Canvas",
              "personalizable": false,
              "type": "OBLinkedItemCanvasItem"
            },
            {
              "name": "_attachments_",
              "personalizable": false,
              "type": "OBAttachmentsSectionItem"
            },
            {
              "name": "_attachments_Canvas",
              "personalizable": false,
              "type": "OBAttachmentCanvasItem"
            }
          ],
          "iconToolbarButtons": [],
          "initialPropertyToColumns": [
            {
              "dbColumn": "AD_Client_ID",
              "inpColumn": "inpadClientId",
              "property": "client",
              "sessionProperty": true,
              "type": "_id_19"
            },
            {
              "dbColumn": "AD_Org_ID",
              "inpColumn": "inpadOrgId",
              "property": "organization",
              "sessionProperty": true,
              "type": "_id_19"
            },
            {
              "dbColumn": "IsActive",
              "inpColumn": "inpisactive",
              "property": "active",
              "type": "_id_20"
            },
            {
              "dbColumn": "C_Order_ID",
              "inpColumn": "inpcOrderId",
              "property": "salesOrder",
              "sessionProperty": true,
              "type": "_id_800062"
            },
            {
              "dbColumn": "C_OrderTax_ID",
              "inpColumn": "inpcOrdertaxId",
              "property": "id",
              "type": "_id_13"
            },
            {
              "dbColumn": "C_OrderTax_ID",
              "inpColumn": "C_OrderTax_ID",
              "property": "id",
              "sessionProperty": true,
              "type": "_id_13"
            }
          ],
          "isDeleteableTable": true,
          "mapping250": "/SalesOrder/Tax",
          "moduleId": "0",
          "notesDataSource": {
            "createClassName": "",
            "dataURL": "/etendo/org.openbravo.service.datasource/090A37D22E61FE94012E621729090048",
            "fields": [
              {
                "name": "id",
                "primaryKey": true,
                "type": "_id_13"
              },
              {
                "name": "client",
                "type": "_id_19"
              },
              {
                "name": "client$_identifier"
              },
              {
                "name": "organization",
                "type": "_id_19"
              },
              {
                "name": "organization$_identifier"
              },
              {
                "name": "table",
                "type": "_id_19"
              },
              {
                "name": "table$_identifier"
              },
              {
                "name": "record",
                "type": "_id_10"
              },
              {
                "name": "note",
                "type": "_id_14"
              },
              {
                "name": "isactive",
                "type": "_id_20"
              },
              {
                "name": "creationDate",
                "type": "_id_16"
              },
              {
                "name": "createdBy",
                "type": "_id_30"
              },
              {
                "name": "createdBy$_identifier"
              },
              {
                "name": "updated",
                "type": "_id_16"
              },
              {
                "name": "updatedBy",
                "type": "_id_30"
              },
              {
                "name": "updatedBy$_identifier"
              }
            ],
            "potentiallyShared": true,
            "requestProperties": {
              "params": {
                "Constants_FIELDSEPARATOR": "$",
                "Constants_IDENTIFIER": "_identifier"
              }
            }
          },
          "parentProperty": "salesOrder",
          "showCloneButton": false,
          "showParentButtons": true,
          "standardProperties": {
            "inpkeyColumnId": "C_OrderTax_ID",
            "inpKeyName": "inpcOrdertaxId",
            "inpTabId": "236",
            "inpTableId": "314",
            "inpwindowId": "143",
            "keyColumnName": "C_OrderTax_ID",
            "keyProperty": "id",
            "keyPropertyType": "_id_13"
          },
          "statusBarFields": [],
          "tabId": "236",
          "tabTitle": "Tax",
          "viewGrid": {
            "allowSummaryFunctions": true,
            "filterClause": false,
            "orderByClause": "lineNo",
            "requiredGridProperties": [
              "id",
              "client",
              "organization",
              "updatedBy",
              "updated",
              "creationDate",
              "createdBy",
              "salesOrder",
              "tax",
              "salesOrder",
              "client",
              "organization",
              "salesOrder",
              "salesOrder"
            ],
            "uiPattern": "RO"
          }
        },
        {
          "actionToolbarButtons": [],
          "askToCloneChildren": true,
          "buttonsHaveSessionLogic": false,
          "createViewStructure": [
            {
              "actionToolbarButtons": [],
              "askToCloneChildren": true,
              "buttonsHaveSessionLogic": false,
              "dataSource": {
                "createClassName": "OBViewDataSource",
                "dataURL": "/etendo/org.openbravo.service.datasource/FIN_Payment_Detail_V",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_30"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_30"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "active",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  },
                  {
                    "name": "orderPaymentPlan",
                    "type": "_id_C01DEDDA9B35427786058CB649FB972F"
                  },
                  {
                    "name": "orderPaymentPlan$_identifier"
                  },
                  {
                    "name": "paymentPlanInvoice",
                    "type": "_id_1FAD22496E6F468DBC46CA23FE204B41"
                  },
                  {
                    "name": "paymentPlanInvoice$_identifier"
                  },
                  {
                    "name": "paymentPlanOrder",
                    "type": "_id_1FAD22496E6F468DBC46CA23FE204B41"
                  },
                  {
                    "name": "paymentPlanOrder$_identifier"
                  },
                  {
                    "name": "invoiceno",
                    "type": "_id_10"
                  },
                  {
                    "name": "orderno",
                    "type": "_id_10"
                  },
                  {
                    "name": "paymentno",
                    "type": "_id_10"
                  },
                  {
                    "name": "payment",
                    "type": "_id_E1C0B1C7D7C84E85903409A39A53E855"
                  },
                  {
                    "name": "payment$_identifier"
                  },
                  {
                    "name": "dueDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "invoiceAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "expected",
                    "type": "_id_12"
                  },
                  {
                    "name": "paidAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "businessPartner",
                    "type": "_id_800057"
                  },
                  {
                    "name": "businessPartner$_identifier"
                  },
                  {
                    "name": "paymentMethod",
                    "type": "_id_30"
                  },
                  {
                    "name": "paymentMethod$_identifier"
                  },
                  {
                    "name": "finFinancialAccount",
                    "type": "_id_30"
                  },
                  {
                    "name": "finFinancialAccount$_identifier"
                  },
                  {
                    "name": "currency",
                    "type": "_id_30"
                  },
                  {
                    "name": "currency$_identifier"
                  },
                  {
                    "name": "paymentDate",
                    "type": "_id_15"
                  },
                  {
                    "name": "glitemname",
                    "type": "_id_10"
                  },
                  {
                    "name": "writeoffAmount",
                    "type": "_id_12"
                  },
                  {
                    "name": "finaccCurrency",
                    "type": "_id_112"
                  },
                  {
                    "name": "finaccCurrency$_identifier"
                  },
                  {
                    "name": "finaccTxnConvertRate",
                    "type": "_id_800019"
                  },
                  {
                    "name": "paidConverted",
                    "type": "_id_12"
                  },
                  {
                    "name": "expectedConverted",
                    "type": "_id_12"
                  },
                  {
                    "name": "canceled",
                    "type": "_id_20"
                  },
                  {
                    "name": "businessPartnerdim",
                    "type": "_id_56DEFF37A33F46D1AC918C97C4447EAF"
                  },
                  {
                    "name": "businessPartnerdim$_identifier"
                  },
                  {
                    "name": "activity",
                    "type": "_id_19"
                  },
                  {
                    "name": "activity$_identifier"
                  },
                  {
                    "name": "product",
                    "type": "_id_800060"
                  },
                  {
                    "name": "product$_identifier"
                  },
                  {
                    "name": "salesCampaign",
                    "type": "_id_19"
                  },
                  {
                    "name": "salesCampaign$_identifier"
                  },
                  {
                    "name": "project",
                    "type": "_id_19"
                  },
                  {
                    "name": "project$_identifier"
                  },
                  {
                    "name": "salesRegion",
                    "type": "_id_19"
                  },
                  {
                    "name": "salesRegion$_identifier"
                  },
                  {
                    "name": "status",
                    "type": "_id_575BCB88A4694C27BC013DE9C73E6FE7",
                    "valueMap": {
                      "PPM": "Payment Made",
                      "PWNC": "Withdrawn not Cleared",
                      "RDNC": "Deposited not Cleared",
                      "RPAE": "Awaiting Execution",
                      "RPAP": "Awaiting Payment",
                      "RPPC": "Payment Cleared",
                      "RPR": "Payment Received",
                      "RPVOID": "Void"
                    }
                  },
                  {
                    "name": "aPRMDisplayedPaymmeth",
                    "type": "_id_F378D8FAEF9441F29D3974ADE211BF98"
                  },
                  {
                    "name": "aPRMDisplayedPaymmeth$_identifier"
                  },
                  {
                    "name": "aPRMDisplayedAcc",
                    "type": "_id_03D336BF39A7455C8FD64CBCCFB4FC1C"
                  },
                  {
                    "name": "aPRMDisplayedAcc$_identifier"
                  },
                  {
                    "additional": true,
                    "name": "businessPartner$name",
                    "type": "_id_10"
                  }
                ],
                "requestProperties": {
                  "params": {
                    "_className": "OBViewDataSource",
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier"
                  }
                }
              },
              "entity": "FIN_Payment_Detail_V",
              "fields": [
                {
                  "columnName": "FIN_Payment_ID",
                  "defaultPopupFilterField": "_identifier",
                  "displayField": "_identifier",
                  "extraSearchFields": [],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 1
                  },
                  "id": "AE165A3BE3854E3391784246B72F80AF",
                  "inpColumnName": "inpfinPaymentId",
                  "name": "payment",
                  "optionDataSource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/FIN_Payment",
                    "fields": [
                      {
                        "name": "id",
                        "primaryKey": true,
                        "type": "_id_13"
                      },
                      {
                        "name": "client",
                        "type": "_id_19"
                      },
                      {
                        "name": "client$_identifier"
                      },
                      {
                        "name": "organization",
                        "type": "_id_19"
                      },
                      {
                        "name": "organization$_identifier"
                      },
                      {
                        "name": "creationDate",
                        "type": "_id_16"
                      },
                      {
                        "name": "createdBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "createdBy$_identifier"
                      },
                      {
                        "name": "updated",
                        "type": "_id_16"
                      },
                      {
                        "name": "updatedBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "updatedBy$_identifier"
                      },
                      {
                        "name": "active",
                        "type": "_id_20"
                      },
                      {
                        "name": "receipt",
                        "type": "_id_20"
                      },
                      {
                        "name": "businessPartner",
                        "type": "_id_800057"
                      },
                      {
                        "name": "businessPartner$_identifier"
                      },
                      {
                        "name": "paymentDate",
                        "type": "_id_15"
                      },
                      {
                        "name": "currency",
                        "type": "_id_19"
                      },
                      {
                        "name": "currency$_identifier"
                      },
                      {
                        "name": "amount",
                        "type": "_id_12"
                      },
                      {
                        "name": "writeoffAmount",
                        "type": "_id_12"
                      },
                      {
                        "name": "paymentMethod",
                        "type": "_id_19"
                      },
                      {
                        "name": "paymentMethod$_identifier"
                      },
                      {
                        "name": "documentNo",
                        "type": "_id_10"
                      },
                      {
                        "name": "referenceNo",
                        "type": "_id_10"
                      },
                      {
                        "name": "status",
                        "type": "_id_575BCB88A4694C27BC013DE9C73E6FE7",
                        "valueMap": {
                          "PPM": "Payment Made",
                          "PWNC": "Withdrawn not Cleared",
                          "RDNC": "Deposited not Cleared",
                          "RPAE": "Awaiting Execution",
                          "RPAP": "Awaiting Payment",
                          "RPPC": "Payment Cleared",
                          "RPR": "Payment Received",
                          "RPVOID": "Void"
                        }
                      },
                      {
                        "name": "processed",
                        "type": "_id_20"
                      },
                      {
                        "name": "processNow",
                        "type": "_id_20"
                      },
                      {
                        "name": "posted",
                        "type": "_id_234",
                        "valueMap": {
                          "AD": "Post: No Accounting Date",
                          "b": "Post: Not Balanced",
                          "c": "Post: Not Convertible (no rate)",
                          "C": "Post: Error, No cost",
                          "D": "Post: Document Disabled",
                          "d": "Post: Disabled For Background",
                          "E": "Post: Error",
                          "i": "Post: Invalid Account",
                          "L": "Post: Document Locked",
                          "N": "Post",
                          "NC": "Post: Cost Not Calculated",
                          "NO": "Post: No Related PO",
                          "p": "Post: Period Closed",
                          "T": "Post: Table Disabled",
                          "Y": "Unpost",
                          "y": "Post: Post Prepared"
                        }
                      },
                      {
                        "name": "description",
                        "type": "_id_14"
                      },
                      {
                        "name": "account",
                        "type": "_id_19"
                      },
                      {
                        "name": "account$_identifier"
                      },
                      {
                        "name": "documentType",
                        "type": "_id_19"
                      },
                      {
                        "name": "documentType$_identifier"
                      },
                      {
                        "name": "project",
                        "type": "_id_800061"
                      },
                      {
                        "name": "project$_identifier"
                      },
                      {
                        "name": "salesCampaign",
                        "type": "_id_FF808181312D569C01312D8C837E003C"
                      },
                      {
                        "name": "salesCampaign$_identifier"
                      },
                      {
                        "name": "activity",
                        "type": "_id_FF808181312D569C01312D846CC40032"
                      },
                      {
                        "name": "activity$_identifier"
                      },
                      {
                        "name": "stDimension",
                        "type": "_id_0E0D1661E18E4E05A118785A7CF146B8"
                      },
                      {
                        "name": "stDimension$_identifier"
                      },
                      {
                        "name": "ndDimension",
                        "type": "_id_1850A5390D97470EBB35A3A5F43AB533"
                      },
                      {
                        "name": "ndDimension$_identifier"
                      },
                      {
                        "name": "generatedCredit",
                        "type": "_id_12"
                      },
                      {
                        "name": "usedCredit",
                        "type": "_id_12"
                      },
                      {
                        "name": "createdByAlgorithm",
                        "type": "_id_20"
                      },
                      {
                        "name": "financialTransactionConvertRate",
                        "type": "_id_800019"
                      },
                      {
                        "name": "financialTransactionAmount",
                        "type": "_id_12"
                      },
                      {
                        "name": "aPRMProcessPayment",
                        "type": "_id_36972531DA994BB38ECB91993058282F",
                        "valueMap": {
                          "P": "Process",
                          "R": "Reactivate and Delete Lines",
                          "RE": "Reactivate",
                          "V": "Void"
                        }
                      },
                      {
                        "name": "reversedPayment",
                        "type": "_id_4BEF5D0691664A939E8710FA9EB0BAF5"
                      },
                      {
                        "name": "reversedPayment$_identifier"
                      },
                      {
                        "name": "costCenter",
                        "type": "_id_DEE6B917B36D4648B2DA729FC2872CF4"
                      },
                      {
                        "name": "costCenter$_identifier"
                      },
                      {
                        "name": "aPRMReconcilePayment",
                        "type": "_id_28"
                      },
                      {
                        "name": "aPRMAddScheduledpayments",
                        "type": "_id_28"
                      },
                      {
                        "name": "aprmExecutepayment",
                        "type": "_id_28"
                      },
                      {
                        "name": "aPRMReversePayment",
                        "type": "_id_28"
                      },
                      {
                        "additional": true,
                        "name": "businessPartner$name",
                        "type": "_id_10"
                      }
                    ],
                    "requestProperties": {
                      "params": {
                        "adTabId": "B82C02920AA84E8DB57D553185BD2F06",
                        "columnName": "FIN_Payment_ID",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "payment"
                      }
                    }
                  },
                  "outFields": {},
                  "outHiddenInputPrefix": "inpfinPaymentId",
                  "pickListFields": [
                    {
                      "name": "_identifier",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "Fin_Payment_ID",
                  "required": true,
                  "selectorDefinitionId": "A021037EAFFA49D299E4B6886E6A811C",
                  "selectorGridFields": [],
                  "showSelectorGrid": false,
                  "targetEntity": "FIN_Payment",
                  "textMatchStyle": "substring",
                  "title": "Payment In",
                  "type": "_id_E1C0B1C7D7C84E85903409A39A53E855",
                  "valueField": "id"
                },
                {
                  "columnName": "Paymentdate",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 2
                  },
                  "id": "5280E667A502462EBD6D493EBD4B129F",
                  "inpColumnName": "inppaymentdate",
                  "length": 19,
                  "name": "paymentDate",
                  "title": "Payment Date",
                  "type": "_id_15"
                },
                {
                  "columnName": "Duedate",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 3
                  },
                  "id": "81FBC24097FC4B0894884DD7ACFD08C1",
                  "inpColumnName": "inpduedate",
                  "length": 19,
                  "name": "dueDate",
                  "title": "Due Date",
                  "type": "_id_15"
                },
                {
                  "columnName": "EM_APRM_Displayed_Paymmeth_ID",
                  "datasource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/FIN_PaymentMethod",
                    "fields": [
                      {
                        "name": "id",
                        "primaryKey": true,
                        "type": "_id_13"
                      },
                      {
                        "name": "client",
                        "type": "_id_19"
                      },
                      {
                        "name": "client$_identifier"
                      },
                      {
                        "name": "organization",
                        "type": "_id_19"
                      },
                      {
                        "name": "organization$_identifier"
                      },
                      {
                        "name": "creationDate",
                        "type": "_id_16"
                      },
                      {
                        "name": "createdBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "createdBy$_identifier"
                      },
                      {
                        "name": "updated",
                        "type": "_id_16"
                      },
                      {
                        "name": "updatedBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "updatedBy$_identifier"
                      },
                      {
                        "name": "active",
                        "type": "_id_20"
                      },
                      {
                        "name": "name",
                        "type": "_id_10"
                      },
                      {
                        "name": "description",
                        "type": "_id_14"
                      },
                      {
                        "name": "automaticReceipt",
                        "type": "_id_20"
                      },
                      {
                        "name": "automaticPayment",
                        "type": "_id_20"
                      },
                      {
                        "name": "automaticDeposit",
                        "type": "_id_20"
                      },
                      {
                        "name": "automaticWithdrawn",
                        "type": "_id_20"
                      },
                      {
                        "name": "payinAllow",
                        "type": "_id_20"
                      },
                      {
                        "name": "payoutAllow",
                        "type": "_id_20"
                      },
                      {
                        "name": "payinExecutionType",
                        "type": "_id_FC98D43996374909B1AAC0197BBE95BA",
                        "valueMap": {
                          "A": "Automatic",
                          "M": "Manual"
                        }
                      },
                      {
                        "name": "payoutExecutionType",
                        "type": "_id_FC98D43996374909B1AAC0197BBE95BA",
                        "valueMap": {
                          "A": "Automatic",
                          "M": "Manual"
                        }
                      },
                      {
                        "name": "payinExecutionProcess",
                        "type": "_id_B7E66794F4BA46C3ADB2CBD013252AA6"
                      },
                      {
                        "name": "payinExecutionProcess$_identifier"
                      },
                      {
                        "name": "payoutExecutionProcess",
                        "type": "_id_B7E66794F4BA46C3ADB2CBD013252AA6"
                      },
                      {
                        "name": "payoutExecutionProcess$_identifier"
                      },
                      {
                        "name": "payinDeferred",
                        "type": "_id_20"
                      },
                      {
                        "name": "payoutDeferred",
                        "type": "_id_20"
                      },
                      {
                        "name": "uponReceiptUse",
                        "type": "_id_085E99751D2045AA9D4FA23F4B765B21",
                        "valueMap": {
                          "CLE": "Cleared Payment Account",
                          "DEP": "Deposited Payment Account",
                          "INT": "In Transit Payment Account",
                          "WIT": "Withdrawn Payment Account"
                        }
                      },
                      {
                        "name": "uponDepositUse",
                        "type": "_id_085E99751D2045AA9D4FA23F4B765B21",
                        "valueMap": {
                          "CLE": "Cleared Payment Account",
                          "DEP": "Deposited Payment Account",
                          "INT": "In Transit Payment Account",
                          "WIT": "Withdrawn Payment Account"
                        }
                      },
                      {
                        "name": "iNUponClearingUse",
                        "type": "_id_085E99751D2045AA9D4FA23F4B765B21",
                        "valueMap": {
                          "CLE": "Cleared Payment Account",
                          "DEP": "Deposited Payment Account",
                          "INT": "In Transit Payment Account",
                          "WIT": "Withdrawn Payment Account"
                        }
                      },
                      {
                        "name": "uponPaymentUse",
                        "type": "_id_085E99751D2045AA9D4FA23F4B765B21",
                        "valueMap": {
                          "CLE": "Cleared Payment Account",
                          "DEP": "Deposited Payment Account",
                          "INT": "In Transit Payment Account",
                          "WIT": "Withdrawn Payment Account"
                        }
                      },
                      {
                        "name": "uponWithdrawalUse",
                        "type": "_id_085E99751D2045AA9D4FA23F4B765B21",
                        "valueMap": {
                          "CLE": "Cleared Payment Account",
                          "DEP": "Deposited Payment Account",
                          "INT": "In Transit Payment Account",
                          "WIT": "Withdrawn Payment Account"
                        }
                      },
                      {
                        "name": "oUTUponClearingUse",
                        "type": "_id_085E99751D2045AA9D4FA23F4B765B21",
                        "valueMap": {
                          "CLE": "Cleared Payment Account",
                          "DEP": "Deposited Payment Account",
                          "INT": "In Transit Payment Account",
                          "WIT": "Withdrawn Payment Account"
                        }
                      },
                      {
                        "name": "payinIsMulticurrency",
                        "type": "_id_20"
                      },
                      {
                        "name": "payoutIsMulticurrency",
                        "type": "_id_20"
                      }
                    ],
                    "requestProperties": {
                      "params": {
                        "adTabId": "B82C02920AA84E8DB57D553185BD2F06",
                        "columnName": "EM_APRM_Displayed_Paymmeth_ID",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "aPRMDisplayedPaymmeth"
                      }
                    }
                  },
                  "defaultPopupFilterField": "_identifier",
                  "displayField": "_identifier",
                  "extraSearchFields": [],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 5
                  },
                  "id": "F2650368C73341B0B6794287FA5C23C2",
                  "inpColumnName": "inpemAprmDisplayedPaymmethId",
                  "name": "aPRMDisplayedPaymmeth",
                  "outFields": {},
                  "outHiddenInputPrefix": "inpemAprmDisplayedPaymmethId",
                  "pickListFields": [
                    {
                      "name": "_identifier",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "Fin_Paymentmethod_ID",
                  "selectorDefinitionId": "B496EA4EDC36442D90CC9B553311DC11",
                  "selectorGridFields": [],
                  "showSelectorGrid": false,
                  "targetEntity": "FIN_PaymentMethod",
                  "textMatchStyle": "startsWith",
                  "title": "Payment Method",
                  "type": "_id_F378D8FAEF9441F29D3974ADE211BF98",
                  "valueField": "id"
                },
                {
                  "columnName": "EM_APRM_Displayed_Acc_ID",
                  "datasource": {
                    "createClassName": "",
                    "dataURL": "/etendo/org.openbravo.service.datasource/FIN_Financial_Account",
                    "fields": [
                      {
                        "name": "id",
                        "primaryKey": true,
                        "type": "_id_13"
                      },
                      {
                        "name": "client",
                        "type": "_id_19"
                      },
                      {
                        "name": "client$_identifier"
                      },
                      {
                        "name": "organization",
                        "type": "_id_19"
                      },
                      {
                        "name": "organization$_identifier"
                      },
                      {
                        "name": "creationDate",
                        "type": "_id_16"
                      },
                      {
                        "name": "createdBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "createdBy$_identifier"
                      },
                      {
                        "name": "updated",
                        "type": "_id_16"
                      },
                      {
                        "name": "updatedBy",
                        "type": "_id_30"
                      },
                      {
                        "name": "updatedBy$_identifier"
                      },
                      {
                        "name": "active",
                        "type": "_id_20"
                      },
                      {
                        "name": "currency",
                        "type": "_id_19"
                      },
                      {
                        "name": "currency$_identifier"
                      },
                      {
                        "name": "name",
                        "type": "_id_10"
                      },
                      {
                        "name": "description",
                        "type": "_id_14"
                      },
                      {
                        "name": "type",
                        "type": "_id_A6BDFA712FF948CE903C4C463E832FC1",
                        "valueMap": {
                          "B": "Bank",
                          "C": "Cash"
                        }
                      },
                      {
                        "name": "businessPartner",
                        "type": "_id_488E4BF765294DD8A7A943BDED4BA6E6"
                      },
                      {
                        "name": "businessPartner$_identifier"
                      },
                      {
                        "name": "locationAddress",
                        "type": "_id_21"
                      },
                      {
                        "name": "locationAddress$_identifier"
                      },
                      {
                        "name": "routingNo",
                        "type": "_id_10"
                      },
                      {
                        "name": "swiftCode",
                        "type": "_id_10"
                      },
                      {
                        "name": "bankCode",
                        "type": "_id_10"
                      },
                      {
                        "name": "branchCode",
                        "type": "_id_10"
                      },
                      {
                        "name": "bankDigitcontrol",
                        "type": "_id_10"
                      },
                      {
                        "name": "iNENo",
                        "type": "_id_10"
                      },
                      {
                        "name": "accountDigitcontrol",
                        "type": "_id_10"
                      },
                      {
                        "name": "partialAccountNo",
                        "type": "_id_10"
                      },
                      {
                        "name": "accountNo",
                        "type": "_id_10"
                      },
                      {
                        "name": "currentBalance",
                        "type": "_id_12"
                      },
                      {
                        "name": "initialBalance",
                        "type": "_id_12"
                      },
                      {
                        "name": "creditLimit",
                        "type": "_id_22"
                      },
                      {
                        "name": "iBAN",
                        "type": "_id_10"
                      },
                      {
                        "name": "default",
                        "type": "_id_20"
                      },
                      {
                        "name": "matchingAlgorithm",
                        "type": "_id_19"
                      },
                      {
                        "name": "matchingAlgorithm$_identifier"
                      },
                      {
                        "name": "typewriteoff",
                        "type": "_id_C3531F85C14B4515AB7259F0D338050D",
                        "valueMap": {
                          "A": "Amount"
                        }
                      },
                      {
                        "name": "writeofflimit",
                        "type": "_id_12"
                      },
                      {
                        "name": "genericAccountNo",
                        "type": "_id_10"
                      },
                      {
                        "name": "country",
                        "type": "_id_19"
                      },
                      {
                        "name": "country$_identifier"
                      },
                      {
                        "name": "bankFormat",
                        "type": "_id_C123B7BF5B2C438D84D2E509734776B5",
                        "valueMap": {
                          "GENERIC": "Use Generic Account No.",
                          "IBAN": "Use IBAN",
                          "SPANISH": "Use Spanish",
                          "SWIFT": "Use SWIFT + Generic Account No."
                        }
                      },
                      {
                        "name": "aPRMImportBankFile",
                        "type": "_id_28"
                      },
                      {
                        "name": "aPRMMatchTransactions",
                        "type": "_id_28"
                      },
                      {
                        "name": "aPRMReconcile",
                        "type": "_id_28"
                      },
                      {
                        "name": "aPRMMatchTransactionsForce",
                        "type": "_id_28"
                      },
                      {
                        "name": "aprmAddtransactionpd",
                        "type": "_id_28"
                      },
                      {
                        "name": "aprmFindtransactionspd",
                        "type": "_id_28"
                      },
                      {
                        "name": "aprmAddMultiplePayments",
                        "type": "_id_28"
                      },
                      {
                        "name": "aprmFundsTrans",
                        "type": "_id_28"
                      },
                      {
                        "name": "aprmIsfundstransEnabled",
                        "type": "_id_20"
                      },
                      {
                        "name": "aprmGlitemDiff",
                        "type": "_id_1A6C5E0A5868417786ECCF3C02B17D65"
                      },
                      {
                        "name": "aprmGlitemDiff$_identifier"
                      },
                      {
                        "name": "lastreconbalance",
                        "type": "_id_12"
                      },
                      {
                        "name": "lastreconciliation",
                        "type": "_id_15"
                      }
                    ],
                    "requestProperties": {
                      "params": {
                        "adTabId": "B82C02920AA84E8DB57D553185BD2F06",
                        "columnName": "EM_APRM_Displayed_Acc_ID",
                        "Constants_FIELDSEPARATOR": "$",
                        "Constants_IDENTIFIER": "_identifier",
                        "IsSelectorItem": "true",
                        "targetProperty": "aPRMDisplayedAcc"
                      }
                    }
                  },
                  "defaultPopupFilterField": "_identifier",
                  "displayField": "_identifier",
                  "extraSearchFields": [],
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 32,
                    "filterEditorProperties": {
                      "keyProperty": "id"
                    },
                    "fkField": true,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 9
                  },
                  "id": "36B58B2BEF8448CA9D384A70E08B9E0E",
                  "inpColumnName": "inpemAprmDisplayedAccId",
                  "name": "aPRMDisplayedAcc",
                  "outFields": {},
                  "outHiddenInputPrefix": "inpemAprmDisplayedAccId",
                  "pickListFields": [
                    {
                      "name": "_identifier",
                      "title": " ",
                      "type": "text"
                    }
                  ],
                  "popupTextMatchStyle": "substring",
                  "refColumnName": "Fin_Financial_Account_ID",
                  "selectorDefinitionId": "7811D4DBBB734D5ABB5DCC0CFDA21B88",
                  "selectorGridFields": [],
                  "showSelectorGrid": false,
                  "startRow": true,
                  "targetEntity": "FIN_Financial_Account",
                  "textMatchStyle": "startsWith",
                  "title": "Financial Account",
                  "type": "_id_03D336BF39A7455C8FD64CBCCFB4FC1C",
                  "valueField": "id"
                },
                {
                  "columnName": "Expected",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 6
                  },
                  "id": "6C7C6E2543B543AFA1171C12D356CC38",
                  "inpColumnName": "inpexpected",
                  "name": "expected",
                  "title": "Expected Amount",
                  "type": "_id_12"
                },
                {
                  "columnName": "Paidamt",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 7
                  },
                  "id": "C2323D9D1E62481B879289D373E65E96",
                  "inpColumnName": "inppaidamt",
                  "name": "paidAmount",
                  "required": true,
                  "title": "Received Amount",
                  "type": "_id_12"
                },
                {
                  "columnName": "Writeoffamt",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 8
                  },
                  "id": "2FF77BE337D74C23BE0AF89A815C2FD3",
                  "inpColumnName": "inpwriteoffamt",
                  "name": "writeoffAmount",
                  "title": "Write-off Amount",
                  "type": "_id_12"
                },
                {
                  "columnName": "ExpectedConverted",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 12
                  },
                  "id": "40289C1D2E1298CF012E12F0CDA300F7",
                  "inpColumnName": "inpexpectedconverted",
                  "name": "expectedConverted",
                  "title": "Expected (Account Currency)",
                  "type": "_id_12"
                },
                {
                  "columnName": "PaidConverted",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 13
                  },
                  "id": "40289C1D2E1298CF012E12F1178100FD",
                  "inpColumnName": "inppaidconverted",
                  "name": "paidConverted",
                  "title": "Received (Account Currency)",
                  "type": "_id_12"
                },
                {
                  "columnName": "Finacc_Txn_Convert_Rate",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "filterOnKeypress": false,
                    "selectOnClick": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 14
                  },
                  "id": "40289C1D2E1298CF012E12F217090104",
                  "inpColumnName": "inpfinaccTxnConvertRate",
                  "name": "finaccTxnConvertRate",
                  "title": "Exchange Rate",
                  "type": "_id_800019"
                },
                {
                  "columnName": "Paymentno",
                  "displayed": false,
                  "gridProps": {
                    "autoExpand": true,
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 30,
                    "length": 30,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 4
                  },
                  "id": "E6EEA6B9F91F459787518691AFBAF351",
                  "inpColumnName": "inppaymentno",
                  "length": 30,
                  "name": "paymentno",
                  "required": true,
                  "title": "Payment No.",
                  "type": "_id_10"
                },
                {
                  "columnName": "Iscanceled",
                  "disabled": true,
                  "gridProps": {
                    "autoFitWidth": false,
                    "canFilter": true,
                    "canGroupBy": false,
                    "canSort": true,
                    "editorProps": {
                      "showLabel": false,
                      "showTitle": false
                    },
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 10,
                    "width": "*",
                    "yesNo": true
                  },
                  "id": "FF80818130D0918F0130D0BECAE800DD",
                  "inpColumnName": "inpiscanceled",
                  "name": "canceled",
                  "overflow": "visible",
                  "title": "Canceled",
                  "type": "_id_20",
                  "width": 1
                },
                {
                  "columnName": "Status",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "displaylength": 60,
                    "filterOnKeypress": false,
                    "length": 60,
                    "selectOnClick": true,
                    "showHover": true,
                    "sort": 11
                  },
                  "id": "C1DE5396D890B815E040007F01000CBC",
                  "inpColumnName": "inpstatus",
                  "name": "status",
                  "required": true,
                  "title": "Status",
                  "type": "_id_575BCB88A4694C27BC013DE9C73E6FE7",
                  "updatable": false
                },
                {
                  "defaultValue": "Audit",
                  "itemIds": [
                    "creationDate",
                    "createdBy",
                    "updated",
                    "updatedBy"
                  ],
                  "name": "1000100001",
                  "personalizable": false,
                  "title": "Audit",
                  "type": "OBAuditSectionItem"
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "creationDate",
                  "personalizable": false,
                  "title": "Creation Date",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "createdBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "createdBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Created By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updated",
                  "personalizable": false,
                  "title": "Updated",
                  "type": "_id_16",
                  "updatable": false
                },
                {
                  "disabled": true,
                  "displayField": "updatedBy$_identifier",
                  "gridProps": {
                    "canFilter": true,
                    "canSort": true,
                    "cellAlign": "left",
                    "fkField": true,
                    "showHover": true,
                    "showIf": "false",
                    "sort": 990
                  },
                  "name": "updatedBy",
                  "personalizable": false,
                  "targetEntity": "User",
                  "title": "Updated By",
                  "type": "_id_30",
                  "updatable": false
                },
                {
                  "name": "_notes_",
                  "personalizable": false,
                  "type": "OBNoteSectionItem"
                },
                {
                  "name": "_notes_Canvas",
                  "personalizable": false,
                  "type": "OBNoteCanvasItem"
                },
                {
                  "name": "_linkedItems_",
                  "personalizable": false,
                  "type": "OBLinkedItemSectionItem"
                },
                {
                  "name": "_linkedItems_Canvas",
                  "personalizable": false,
                  "type": "OBLinkedItemCanvasItem"
                },
                {
                  "name": "_attachments_",
                  "personalizable": false,
                  "type": "OBAttachmentsSectionItem"
                },
                {
                  "name": "_attachments_Canvas",
                  "personalizable": false,
                  "type": "OBAttachmentCanvasItem"
                }
              ],
              "iconToolbarButtons": [],
              "initialPropertyToColumns": [
                {
                  "dbColumn": "Fin_Paymentmethod_ID",
                  "inpColumn": "inpfinPaymentmethodId",
                  "property": "paymentMethod",
                  "type": "_id_30"
                },
                {
                  "dbColumn": "Fin_Financial_Account_ID",
                  "inpColumn": "inpfinFinancialAccountId",
                  "property": "finFinancialAccount",
                  "type": "_id_30"
                },
                {
                  "dbColumn": "C_Currency_ID",
                  "inpColumn": "inpcCurrencyId",
                  "property": "currency",
                  "type": "_id_30"
                },
                {
                  "dbColumn": "Finacc_Currency_ID",
                  "inpColumn": "inpfinaccCurrencyId",
                  "property": "finaccCurrency",
                  "type": "_id_112"
                },
                {
                  "dbColumn": "AD_Client_ID",
                  "inpColumn": "inpadClientId",
                  "property": "client",
                  "sessionProperty": true,
                  "type": "_id_30"
                },
                {
                  "dbColumn": "C_Bpartner_ID",
                  "inpColumn": "inpcBpartnerId",
                  "property": "businessPartner",
                  "type": "_id_800057"
                },
                {
                  "dbColumn": "Invoicedamt",
                  "inpColumn": "inpinvoicedamt",
                  "property": "invoiceAmount",
                  "type": "_id_12"
                },
                {
                  "dbColumn": "AD_Org_ID",
                  "inpColumn": "inpadOrgId",
                  "property": "organization",
                  "sessionProperty": true,
                  "type": "_id_30"
                },
                {
                  "dbColumn": "Fin_Payment_Sched_Ord_V_Id",
                  "inpColumn": "inpfinPaymentSchedOrdVId",
                  "property": "orderPaymentPlan",
                  "type": "_id_C01DEDDA9B35427786058CB649FB972F"
                },
                {
                  "dbColumn": "Isactive",
                  "inpColumn": "inpisactive",
                  "property": "active",
                  "type": "_id_20"
                },
                {
                  "dbColumn": "Orderno",
                  "inpColumn": "inporderno",
                  "property": "orderno",
                  "type": "_id_10"
                },
                {
                  "dbColumn": "Fin_Payment_Detail_V_ID",
                  "inpColumn": "inpfinPaymentDetailVId",
                  "property": "id",
                  "type": "_id_13"
                },
                {
                  "dbColumn": "Invoiceno",
                  "inpColumn": "inpinvoiceno",
                  "property": "invoiceno",
                  "type": "_id_10"
                },
                {
                  "dbColumn": "Fin_Payment_Detail_V_ID",
                  "inpColumn": "Fin_Payment_Detail_V_ID",
                  "property": "id",
                  "sessionProperty": true,
                  "type": "_id_13"
                }
              ],
              "isDeleteableTable": true,
              "mapping250": "/SalesOrder/PaymentDetailsB82C02920AA84E8DB57D553185BD2F06",
              "moduleId": "A918E3331C404B889D69AA9BFAFB23AC",
              "notesDataSource": {
                "createClassName": "",
                "dataURL": "/etendo/org.openbravo.service.datasource/090A37D22E61FE94012E621729090048",
                "fields": [
                  {
                    "name": "id",
                    "primaryKey": true,
                    "type": "_id_13"
                  },
                  {
                    "name": "client",
                    "type": "_id_19"
                  },
                  {
                    "name": "client$_identifier"
                  },
                  {
                    "name": "organization",
                    "type": "_id_19"
                  },
                  {
                    "name": "organization$_identifier"
                  },
                  {
                    "name": "table",
                    "type": "_id_19"
                  },
                  {
                    "name": "table$_identifier"
                  },
                  {
                    "name": "record",
                    "type": "_id_10"
                  },
                  {
                    "name": "note",
                    "type": "_id_14"
                  },
                  {
                    "name": "isactive",
                    "type": "_id_20"
                  },
                  {
                    "name": "creationDate",
                    "type": "_id_16"
                  },
                  {
                    "name": "createdBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "createdBy$_identifier"
                  },
                  {
                    "name": "updated",
                    "type": "_id_16"
                  },
                  {
                    "name": "updatedBy",
                    "type": "_id_30"
                  },
                  {
                    "name": "updatedBy$_identifier"
                  }
                ],
                "potentiallyShared": true,
                "requestProperties": {
                  "params": {
                    "Constants_FIELDSEPARATOR": "$",
                    "Constants_IDENTIFIER": "_identifier"
                  }
                }
              },
              "parentProperty": "orderPaymentPlan",
              "showCloneButton": false,
              "showParentButtons": true,
              "standardProperties": {
                "inpkeyColumnId": "Fin_Payment_Detail_V_ID",
                "inpKeyName": "inpfinPaymentDetailVId",
                "inpTabId": "B82C02920AA84E8DB57D553185BD2F06",
                "inpTableId": "DC63963AB3F1489BAAB5A9A7EFD1B407",
                "inpwindowId": "143",
                "keyColumnName": "Fin_Payment_Detail_V_ID",
                "keyProperty": "id",
                "keyPropertyType": "_id_13"
              },
              "statusBarFields": [],
              "tabId": "B82C02920AA84E8DB57D553185BD2F06",
              "tabTitle": "Payment Details",
              "viewGrid": {
                "allowSummaryFunctions": true,
                "filterClause": false,
                "requiredGridProperties": [
                  "id",
                  "client",
                  "organization",
                  "updatedBy",
                  "updated",
                  "creationDate",
                  "createdBy",
                  "payment",
                  "currency",
                  "paymentDate",
                  "orderPaymentPlan",
                  "glitemname",
                  "paidAmount",
                  "currency",
                  "finaccCurrency",
                  "orderPaymentPlan",
                  "client",
                  "organization"
                ],
                "sortField": "payment",
                "uiPattern": "RO"
              }
            }
          ],
          "dataSource": {
            "createClassName": "OBViewDataSource",
            "dataURL": "/etendo/org.openbravo.service.datasource/FIN_Payment_Sched_Ord_V",
            "fields": [
              {
                "name": "id",
                "primaryKey": true,
                "type": "_id_13"
              },
              {
                "name": "client",
                "type": "_id_30"
              },
              {
                "name": "client$_identifier"
              },
              {
                "name": "organization",
                "type": "_id_30"
              },
              {
                "name": "organization$_identifier"
              },
              {
                "name": "active",
                "type": "_id_20"
              },
              {
                "name": "creationDate",
                "type": "_id_16"
              },
              {
                "name": "createdBy",
                "type": "_id_30"
              },
              {
                "name": "createdBy$_identifier"
              },
              {
                "name": "updated",
                "type": "_id_16"
              },
              {
                "name": "updatedBy",
                "type": "_id_30"
              },
              {
                "name": "updatedBy$_identifier"
              },
              {
                "name": "invoice",
                "type": "_id_30"
              },
              {
                "name": "invoice$_identifier"
              },
              {
                "name": "salesOrder",
                "type": "_id_30"
              },
              {
                "name": "salesOrder$_identifier"
              },
              {
                "name": "dueDate",
                "type": "_id_15"
              },
              {
                "name": "paymentMethod",
                "type": "_id_30"
              },
              {
                "name": "paymentMethod$_identifier"
              },
              {
                "name": "expected",
                "type": "_id_12"
              },
              {
                "name": "received",
                "type": "_id_12"
              },
              {
                "name": "outstanding",
                "type": "_id_12"
              },
              {
                "name": "currency",
                "type": "_id_30"
              },
              {
                "name": "currency$_identifier"
              },
              {
                "name": "lastPayment",
                "type": "_id_15"
              },
              {
                "name": "numberOfPayments",
                "type": "_id_11"
              },
              {
                "name": "fINPaymentPriority",
                "type": "_id_30"
              },
              {
                "name": "fINPaymentPriority$_identifier"
              },
              {
                "name": "updatePaymentPlan",
                "type": "_id_28"
              }
            ],
            "requestProperties": {
              "params": {
                "_className": "OBViewDataSource",
                "Constants_FIELDSEPARATOR": "$",
                "Constants_IDENTIFIER": "_identifier"
              }
            }
          },
          "entity": "FIN_Payment_Sched_Ord_V",
          "fields": [
            {
              "columnName": "Duedate",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 1
              },
              "id": "897F23D8C4A94CDBA1E18A1950A6D8F7",
              "inpColumnName": "inpduedate",
              "length": 19,
              "name": "dueDate",
              "sessionProperty": true,
              "title": "Due Date",
              "type": "_id_15"
            },
            {
              "columnName": "FIN_Paymentmethod_ID",
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 32,
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "sort": 2
              },
              "id": "64A645D93D704FA080658916E4AA11BA",
              "inpColumnName": "inpfinPaymentmethodId",
              "name": "paymentMethod",
              "refColumnName": "Fin_Paymentmethod_ID",
              "required": true,
              "targetEntity": "FIN_PaymentMethod",
              "title": "Payment Method",
              "type": "_id_30"
            },
            {
              "columnName": "Expected",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 3
              },
              "id": "E9450E417F5D476B950CD9F298027E93",
              "inpColumnName": "inpexpected",
              "name": "expected",
              "required": true,
              "title": "Expected Amount",
              "type": "_id_12"
            },
            {
              "columnName": "Received",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 4
              },
              "id": "DAE4D1BC0FCD4C77BA7CA8E89BB2C9C4",
              "inpColumnName": "inpreceived",
              "name": "received",
              "required": true,
              "title": "Received",
              "type": "_id_12"
            },
            {
              "columnName": "Outstanding",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 5
              },
              "id": "82F148CC68F24714AEDC5ACD4681D5B7",
              "inpColumnName": "inpoutstanding",
              "name": "outstanding",
              "required": true,
              "title": "Outstanding",
              "type": "_id_12"
            },
            {
              "columnName": "Lastpayment",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 6
              },
              "id": "94CEB84F4308426AA4CDE843C2B3C03C",
              "inpColumnName": "inplastpayment",
              "length": 19,
              "name": "lastPayment",
              "title": "Last Payment Date",
              "type": "_id_15"
            },
            {
              "columnName": "Numberofpayments",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "filterOnKeypress": false,
                "selectOnClick": true,
                "showHover": true,
                "sort": 7
              },
              "id": "F3653CEB40B54EF88F365D55E46CB543",
              "inpColumnName": "inpnumberofpayments",
              "name": "numberOfPayments",
              "title": "Number of Payments",
              "type": "_id_11"
            },
            {
              "columnName": "C_Currency_ID",
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "displaylength": 19,
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "sort": 8
              },
              "id": "667EAE9815D74CFAB0030166BF422851",
              "inpColumnName": "inpcCurrencyId",
              "name": "currency",
              "refColumnName": "C_Currency_ID",
              "required": true,
              "targetEntity": "Currency",
              "title": "Currency",
              "type": "_id_30"
            },
            {
              "defaultValue": "Audit",
              "itemIds": ["creationDate", "createdBy", "updated", "updatedBy"],
              "name": "1000100001",
              "personalizable": false,
              "title": "Audit",
              "type": "OBAuditSectionItem"
            },
            {
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "creationDate",
              "personalizable": false,
              "title": "Creation Date",
              "type": "_id_16",
              "updatable": false
            },
            {
              "disabled": true,
              "displayField": "createdBy$_identifier",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "fkField": true,
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "createdBy",
              "personalizable": false,
              "targetEntity": "User",
              "title": "Created By",
              "type": "_id_30",
              "updatable": false
            },
            {
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "updated",
              "personalizable": false,
              "title": "Updated",
              "type": "_id_16",
              "updatable": false
            },
            {
              "disabled": true,
              "displayField": "updatedBy$_identifier",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "fkField": true,
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "updatedBy",
              "personalizable": false,
              "targetEntity": "User",
              "title": "Updated By",
              "type": "_id_30",
              "updatable": false
            },
            {
              "name": "_notes_",
              "personalizable": false,
              "type": "OBNoteSectionItem"
            },
            {
              "name": "_notes_Canvas",
              "personalizable": false,
              "type": "OBNoteCanvasItem"
            },
            {
              "name": "_linkedItems_",
              "personalizable": false,
              "type": "OBLinkedItemSectionItem"
            },
            {
              "name": "_linkedItems_Canvas",
              "personalizable": false,
              "type": "OBLinkedItemCanvasItem"
            },
            {
              "name": "_attachments_",
              "personalizable": false,
              "type": "OBAttachmentsSectionItem"
            },
            {
              "name": "_attachments_Canvas",
              "personalizable": false,
              "type": "OBAttachmentCanvasItem"
            }
          ],
          "hasChildTabs": true,
          "iconToolbarButtons": [],
          "initialPropertyToColumns": [
            {
              "dbColumn": "AD_Client_ID",
              "inpColumn": "inpadClientId",
              "property": "client",
              "sessionProperty": true,
              "type": "_id_30"
            },
            {
              "dbColumn": "C_Invoice_ID",
              "inpColumn": "inpcInvoiceId",
              "property": "invoice",
              "type": "_id_30"
            },
            {
              "dbColumn": "C_Order_ID",
              "inpColumn": "inpcOrderId",
              "property": "salesOrder",
              "type": "_id_30"
            },
            {
              "dbColumn": "Isactive",
              "inpColumn": "inpisactive",
              "property": "active",
              "type": "_id_20"
            },
            {
              "dbColumn": "AD_Org_ID",
              "inpColumn": "inpadOrgId",
              "property": "organization",
              "sessionProperty": true,
              "type": "_id_30"
            },
            {
              "dbColumn": "Fin_Payment_Sched_Ord_V_ID",
              "inpColumn": "inpfinPaymentSchedOrdVId",
              "property": "id",
              "type": "_id_13"
            },
            {
              "dbColumn": "Fin_Payment_Sched_Ord_V_ID",
              "inpColumn": "Fin_Payment_Sched_Ord_V_ID",
              "property": "id",
              "sessionProperty": true,
              "type": "_id_13"
            }
          ],
          "isDeleteableTable": true,
          "mapping250": "/SalesOrder/PaymentPlanEB0E0C5A58344F7FA345097E7365CD22",
          "moduleId": "A918E3331C404B889D69AA9BFAFB23AC",
          "notesDataSource": {
            "createClassName": "",
            "dataURL": "/etendo/org.openbravo.service.datasource/090A37D22E61FE94012E621729090048",
            "fields": [
              {
                "name": "id",
                "primaryKey": true,
                "type": "_id_13"
              },
              {
                "name": "client",
                "type": "_id_19"
              },
              {
                "name": "client$_identifier"
              },
              {
                "name": "organization",
                "type": "_id_19"
              },
              {
                "name": "organization$_identifier"
              },
              {
                "name": "table",
                "type": "_id_19"
              },
              {
                "name": "table$_identifier"
              },
              {
                "name": "record",
                "type": "_id_10"
              },
              {
                "name": "note",
                "type": "_id_14"
              },
              {
                "name": "isactive",
                "type": "_id_20"
              },
              {
                "name": "creationDate",
                "type": "_id_16"
              },
              {
                "name": "createdBy",
                "type": "_id_30"
              },
              {
                "name": "createdBy$_identifier"
              },
              {
                "name": "updated",
                "type": "_id_16"
              },
              {
                "name": "updatedBy",
                "type": "_id_30"
              },
              {
                "name": "updatedBy$_identifier"
              }
            ],
            "potentiallyShared": true,
            "requestProperties": {
              "params": {
                "Constants_FIELDSEPARATOR": "$",
                "Constants_IDENTIFIER": "_identifier"
              }
            }
          },
          "parentProperty": "salesOrder",
          "showCloneButton": false,
          "showParentButtons": true,
          "standardProperties": {
            "inpkeyColumnId": "Fin_Payment_Sched_Ord_V_ID",
            "inpKeyName": "inpfinPaymentSchedOrdVId",
            "inpTabId": "EB0E0C5A58344F7FA345097E7365CD22",
            "inpTableId": "70E57DEA195843729FF303C9A71EBCA3",
            "inpwindowId": "143",
            "keyColumnName": "Fin_Payment_Sched_Ord_V_ID",
            "keyProperty": "id",
            "keyPropertyType": "_id_13"
          },
          "statusBarFields": [],
          "tabId": "EB0E0C5A58344F7FA345097E7365CD22",
          "tabTitle": "Payment Plan",
          "viewGrid": {
            "allowSummaryFunctions": true,
            "filterClause": false,
            "requiredGridProperties": [
              "id",
              "client",
              "organization",
              "updatedBy",
              "updated",
              "creationDate",
              "createdBy",
              "salesOrder",
              "dueDate",
              "currency",
              "salesOrder",
              "dueDate",
              "client",
              "organization"
            ],
            "sortField": "dueDate",
            "uiPattern": "RO"
          }
        },
        {
          "actionToolbarButtons": [],
          "askToCloneChildren": true,
          "buttonsHaveSessionLogic": false,
          "dataSource": {
            "createClassName": "OBViewDataSource",
            "dataURL": "/etendo/org.openbravo.service.datasource/OrderReplacement",
            "fields": [
              {
                "name": "id",
                "primaryKey": true,
                "type": "_id_13"
              },
              {
                "name": "client",
                "type": "_id_19"
              },
              {
                "name": "client$_identifier"
              },
              {
                "name": "organization",
                "type": "_id_19"
              },
              {
                "name": "organization$_identifier"
              },
              {
                "name": "active",
                "type": "_id_20"
              },
              {
                "name": "creationDate",
                "type": "_id_16"
              },
              {
                "name": "createdBy",
                "type": "_id_30"
              },
              {
                "name": "createdBy$_identifier"
              },
              {
                "name": "updated",
                "type": "_id_16"
              },
              {
                "name": "updatedBy",
                "type": "_id_30"
              },
              {
                "name": "updatedBy$_identifier"
              },
              {
                "name": "salesOrder",
                "type": "_id_19"
              },
              {
                "name": "salesOrder$_identifier"
              },
              {
                "name": "replacement",
                "type": "_id_290"
              },
              {
                "name": "replacement$_identifier"
              }
            ],
            "requestProperties": {
              "params": {
                "_className": "OBViewDataSource",
                "Constants_FIELDSEPARATOR": "$",
                "Constants_IDENTIFIER": "_identifier"
              }
            }
          },
          "entity": "OrderReplacement",
          "fields": [
            {
              "columnName": "C_Replacement_ID",
              "gridProps": {
                "autoExpand": true,
                "canFilter": true,
                "canSort": true,
                "criteriaDisplayField": "documentNo",
                "criteriaField": "replacement$documentNo",
                "displaylength": 32,
                "displayProperty": "documentNo",
                "editorProps": {
                  "displayField": "_identifier",
                  "valueField": "id"
                },
                "filterEditorProperties": {
                  "keyProperty": "id"
                },
                "fkField": true,
                "selectOnClick": true,
                "showHover": true,
                "sort": 1
              },
              "id": "60653591007C42B989828406F4B5ED11",
              "inpColumnName": "inpcReplacementId",
              "name": "replacement",
              "refColumnName": "C_Order_ID",
              "required": true,
              "targetEntity": "Order",
              "title": "Replacement Order",
              "type": "_id_290"
            },
            {
              "defaultValue": "Audit",
              "itemIds": ["creationDate", "createdBy", "updated", "updatedBy"],
              "name": "1000100001",
              "personalizable": false,
              "title": "Audit",
              "type": "OBAuditSectionItem"
            },
            {
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "creationDate",
              "personalizable": false,
              "title": "Creation Date",
              "type": "_id_16",
              "updatable": false
            },
            {
              "disabled": true,
              "displayField": "createdBy$_identifier",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "fkField": true,
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "createdBy",
              "personalizable": false,
              "targetEntity": "User",
              "title": "Created By",
              "type": "_id_30",
              "updatable": false
            },
            {
              "disabled": true,
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "updated",
              "personalizable": false,
              "title": "Updated",
              "type": "_id_16",
              "updatable": false
            },
            {
              "disabled": true,
              "displayField": "updatedBy$_identifier",
              "gridProps": {
                "canFilter": true,
                "canSort": true,
                "cellAlign": "left",
                "fkField": true,
                "showHover": true,
                "showIf": "false",
                "sort": 990
              },
              "name": "updatedBy",
              "personalizable": false,
              "targetEntity": "User",
              "title": "Updated By",
              "type": "_id_30",
              "updatable": false
            },
            {
              "name": "_notes_",
              "personalizable": false,
              "type": "OBNoteSectionItem"
            },
            {
              "name": "_notes_Canvas",
              "personalizable": false,
              "type": "OBNoteCanvasItem"
            },
            {
              "name": "_linkedItems_",
              "personalizable": false,
              "type": "OBLinkedItemSectionItem"
            },
            {
              "name": "_linkedItems_Canvas",
              "personalizable": false,
              "type": "OBLinkedItemCanvasItem"
            },
            {
              "name": "_attachments_",
              "personalizable": false,
              "type": "OBAttachmentsSectionItem"
            },
            {
              "name": "_attachments_Canvas",
              "personalizable": false,
              "type": "OBAttachmentCanvasItem"
            }
          ],
          "iconToolbarButtons": [],
          "initialPropertyToColumns": [
            {
              "dbColumn": "C_Order_Replacement_ID",
              "inpColumn": "inpcOrderReplacementId",
              "property": "id",
              "type": "_id_13"
            },
            {
              "dbColumn": "Isactive",
              "inpColumn": "inpisactive",
              "property": "active",
              "type": "_id_20"
            },
            {
              "dbColumn": "AD_Org_ID",
              "inpColumn": "inpadOrgId",
              "property": "organization",
              "sessionProperty": true,
              "type": "_id_19"
            },
            {
              "dbColumn": "C_Order_ID",
              "inpColumn": "inpcOrderId",
              "property": "salesOrder",
              "type": "_id_19"
            },
            {
              "dbColumn": "AD_Client_ID",
              "inpColumn": "inpadClientId",
              "property": "client",
              "sessionProperty": true,
              "type": "_id_19"
            },
            {
              "dbColumn": "C_Order_Replacement_ID",
              "inpColumn": "C_Order_Replacement_ID",
              "property": "id",
              "sessionProperty": true,
              "type": "_id_13"
            }
          ],
          "isDeleteableTable": true,
          "mapping250": "/SalesOrder/ReplacementOrders",
          "moduleId": "0",
          "notesDataSource": {
            "createClassName": "",
            "dataURL": "/etendo/org.openbravo.service.datasource/090A37D22E61FE94012E621729090048",
            "fields": [
              {
                "name": "id",
                "primaryKey": true,
                "type": "_id_13"
              },
              {
                "name": "client",
                "type": "_id_19"
              },
              {
                "name": "client$_identifier"
              },
              {
                "name": "organization",
                "type": "_id_19"
              },
              {
                "name": "organization$_identifier"
              },
              {
                "name": "table",
                "type": "_id_19"
              },
              {
                "name": "table$_identifier"
              },
              {
                "name": "record",
                "type": "_id_10"
              },
              {
                "name": "note",
                "type": "_id_14"
              },
              {
                "name": "isactive",
                "type": "_id_20"
              },
              {
                "name": "creationDate",
                "type": "_id_16"
              },
              {
                "name": "createdBy",
                "type": "_id_30"
              },
              {
                "name": "createdBy$_identifier"
              },
              {
                "name": "updated",
                "type": "_id_16"
              },
              {
                "name": "updatedBy",
                "type": "_id_30"
              },
              {
                "name": "updatedBy$_identifier"
              }
            ],
            "potentiallyShared": true,
            "requestProperties": {
              "params": {
                "Constants_FIELDSEPARATOR": "$",
                "Constants_IDENTIFIER": "_identifier"
              }
            }
          },
          "parentProperty": "salesOrder",
          "showCloneButton": false,
          "showParentButtons": true,
          "standardProperties": {
            "inpkeyColumnId": "C_Order_Replacement_ID",
            "inpKeyName": "inpcOrderReplacementId",
            "inpTabId": "5A3B6D4D50444C94B2A2B99E6FD2FB0A",
            "inpTableId": "09DE692CB27A4EF38A9865D4CBCD298D",
            "inpwindowId": "143",
            "keyColumnName": "C_Order_Replacement_ID",
            "keyProperty": "id",
            "keyPropertyType": "_id_13"
          },
          "statusBarFields": [],
          "tabId": "5A3B6D4D50444C94B2A2B99E6FD2FB0A",
          "tabTitle": "Replacement Orders",
          "viewGrid": {
            "allowSummaryFunctions": true,
            "filterClause": false,
            "requiredGridProperties": [
              "id",
              "client",
              "organization",
              "updatedBy",
              "updated",
              "creationDate",
              "createdBy",
              "replacement",
              "salesOrder",
              "organization",
              "client"
            ],
            "sortField": "replacement",
            "uiPattern": "RO"
          }
        }
      ],
      "dataSource": {
        "createClassName": "OBViewDataSource",
        "dataURL": "/etendo/org.openbravo.service.datasource/Order",
        "fields": [
          {
            "name": "id",
            "primaryKey": true,
            "type": "_id_13"
          },
          {
            "name": "client",
            "type": "_id_19"
          },
          {
            "name": "client$_identifier"
          },
          {
            "name": "organization",
            "type": "_id_19"
          },
          {
            "name": "organization$_identifier"
          },
          {
            "name": "active",
            "type": "_id_20"
          },
          {
            "name": "creationDate",
            "type": "_id_16"
          },
          {
            "name": "createdBy",
            "type": "_id_30"
          },
          {
            "name": "createdBy$_identifier"
          },
          {
            "name": "updated",
            "type": "_id_16"
          },
          {
            "name": "updatedBy",
            "type": "_id_30"
          },
          {
            "name": "updatedBy$_identifier"
          },
          {
            "name": "salesTransaction",
            "type": "_id_20"
          },
          {
            "name": "documentNo",
            "type": "_id_10"
          },
          {
            "name": "documentStatus",
            "type": "_id_FF80818130217A350130218D802B0011",
            "valueMap": {
              "??": "Unknown",
              "AE": "Automatic Evaluation",
              "CA": "Closed - Order Created",
              "CJ": "Closed - Rejected",
              "CL": "Closed",
              "CO": "Booked",
              "DR": "Draft",
              "IP": "Under Way",
              "ME": "Manual Evaluation",
              "NA": "Not Accepted",
              "NC": "Not Confirmed",
              "RE": "Re-Opened",
              "TMP": "Temporal",
              "UE": "Under Evaluation",
              "VO": "Voided",
              "WP": "Not Paid"
            }
          },
          {
            "name": "documentAction",
            "type": "_id_FF80818130217A35013021A672400035",
            "valueMap": {
              "--": "<None>",
              "AP": "Approve",
              "CL": "Close",
              "CO": "Book",
              "PO": "Post",
              "PR": "Process",
              "RA": "Reverse - Accrual",
              "RC": "Void",
              "RE": "Reactivate",
              "RJ": "Reject",
              "VO": "Void",
              "XL": "Unlock"
            }
          },
          {
            "name": "processNow",
            "type": "_id_28"
          },
          {
            "name": "processed",
            "type": "_id_20"
          },
          {
            "name": "documentType",
            "type": "_id_19"
          },
          {
            "name": "documentType$_identifier"
          },
          {
            "name": "transactionDocument",
            "type": "_id_22F546D49D3A48E1B2B4F50446A8DE58"
          },
          {
            "name": "transactionDocument$_identifier"
          },
          {
            "name": "description",
            "type": "_id_10"
          },
          {
            "name": "delivered",
            "type": "_id_20"
          },
          {
            "name": "reinvoice",
            "type": "_id_20"
          },
          {
            "name": "print",
            "type": "_id_20"
          },
          {
            "name": "selected",
            "type": "_id_20"
          },
          {
            "name": "salesRepresentative",
            "type": "_id_190"
          },
          {
            "name": "salesRepresentative$_identifier"
          },
          {
            "name": "orderDate",
            "type": "_id_15"
          },
          {
            "name": "scheduledDeliveryDate",
            "type": "_id_15"
          },
          {
            "name": "datePrinted",
            "type": "_id_15"
          },
          {
            "name": "accountingDate",
            "type": "_id_15"
          },
          {
            "name": "businessPartner",
            "type": "_id_800057"
          },
          {
            "name": "businessPartner$_identifier"
          },
          {
            "name": "invoiceAddress",
            "type": "_id_159"
          },
          {
            "name": "invoiceAddress$_identifier"
          },
          {
            "name": "partnerAddress",
            "type": "_id_19"
          },
          {
            "name": "partnerAddress$_identifier"
          },
          {
            "name": "orderReference",
            "type": "_id_10"
          },
          {
            "name": "printDiscount",
            "type": "_id_20"
          },
          {
            "name": "currency",
            "type": "_id_19"
          },
          {
            "name": "currency$_identifier"
          },
          {
            "name": "formOfPayment",
            "type": "_id_195",
            "valueMap": {
              "1": "Wire Transfer",
              "2": "Check",
              "3": "Promissory Note",
              "4": "Money Order",
              "5": "Bank Deposit",
              "B": "Cash",
              "C": "Cash on Delivery",
              "K": "Credit Card",
              "P": "On Credit",
              "R": "Bank Remittance",
              "W": "Withholding"
            }
          },
          {
            "name": "paymentTerms",
            "type": "_id_19"
          },
          {
            "name": "paymentTerms$_identifier"
          },
          {
            "name": "invoiceTerms",
            "type": "_id_150",
            "valueMap": {
              "D": "After Delivery",
              "I": "Immediate",
              "N": "Do Not Invoice",
              "O": "After Order Delivered",
              "S": "Customer Schedule After Delivery"
            }
          },
          {
            "name": "deliveryTerms",
            "type": "_id_151",
            "valueMap": {
              "A": "Availability",
              "L": "Complete Line",
              "O": "Complete Order",
              "R": "After Receipt"
            }
          },
          {
            "name": "freightCostRule",
            "type": "_id_153",
            "valueMap": {
              "C": "Calculated",
              "I": "Freight included"
            }
          },
          {
            "name": "freightAmount",
            "type": "_id_12"
          },
          {
            "name": "deliveryMethod",
            "type": "_id_152",
            "valueMap": {
              "D": "Delivery",
              "P": "Pickup",
              "S": "Shipper"
            }
          },
          {
            "name": "shippingCompany",
            "type": "_id_19"
          },
          {
            "name": "shippingCompany$_identifier"
          },
          {
            "name": "charge",
            "type": "_id_200"
          },
          {
            "name": "charge$_identifier"
          },
          {
            "name": "chargeAmount",
            "type": "_id_12"
          },
          {
            "name": "priority",
            "type": "_id_154",
            "valueMap": {
              "3": "High",
              "5": "Medium",
              "7": "Low"
            }
          },
          {
            "name": "summedLineAmount",
            "type": "_id_12"
          },
          {
            "name": "grandTotalAmount",
            "type": "_id_12"
          },
          {
            "name": "warehouse",
            "type": "_id_263693E51C7847BF90C897ADB830E2BB"
          },
          {
            "name": "warehouse$_identifier"
          },
          {
            "name": "priceList",
            "type": "_id_19"
          },
          {
            "name": "priceList$_identifier"
          },
          {
            "name": "priceIncludesTax",
            "type": "_id_20"
          },
          {
            "name": "salesCampaign",
            "type": "_id_19"
          },
          {
            "name": "salesCampaign$_identifier"
          },
          {
            "name": "project",
            "type": "_id_800061"
          },
          {
            "name": "project$_identifier"
          },
          {
            "name": "activity",
            "type": "_id_19"
          },
          {
            "name": "activity$_identifier"
          },
          {
            "name": "posted",
            "type": "_id_234",
            "valueMap": {
              "AD": "Post: No Accounting Date",
              "b": "Post: Not Balanced",
              "c": "Post: Not Convertible (no rate)",
              "C": "Post: Error, No cost",
              "D": "Post: Document Disabled",
              "d": "Post: Disabled For Background",
              "E": "Post: Error",
              "i": "Post: Invalid Account",
              "L": "Post: Document Locked",
              "N": "Post",
              "NC": "Post: Cost Not Calculated",
              "NO": "Post: No Related PO",
              "p": "Post: Period Closed",
              "T": "Post: Table Disabled",
              "Y": "Unpost",
              "y": "Post: Post Prepared"
            }
          },
          {
            "name": "userContact",
            "type": "_id_19"
          },
          {
            "name": "userContact$_identifier"
          },
          {
            "name": "copyFrom",
            "type": "_id_28"
          },
          {
            "name": "dropShipPartner",
            "type": "_id_FF9658201F8B4BE780BE00AAA9499ED5"
          },
          {
            "name": "dropShipPartner$_identifier"
          },
          {
            "name": "dropShipLocation",
            "type": "_id_159"
          },
          {
            "name": "dropShipLocation$_identifier"
          },
          {
            "name": "dropShipContact",
            "type": "_id_110"
          },
          {
            "name": "dropShipContact$_identifier"
          },
          {
            "name": "selfService",
            "type": "_id_20"
          },
          {
            "name": "trxOrganization",
            "type": "_id_130"
          },
          {
            "name": "trxOrganization$_identifier"
          },
          {
            "name": "stDimension",
            "type": "_id_0E0D1661E18E4E05A118785A7CF146B8"
          },
          {
            "name": "stDimension$_identifier"
          },
          {
            "name": "ndDimension",
            "type": "_id_1850A5390D97470EBB35A3A5F43AB533"
          },
          {
            "name": "ndDimension$_identifier"
          },
          {
            "name": "deliveryNotes",
            "type": "_id_14"
          },
          {
            "name": "incoterms",
            "type": "_id_19"
          },
          {
            "name": "incoterms$_identifier"
          },
          {
            "name": "iNCOTERMSDescription",
            "type": "_id_14"
          },
          {
            "name": "generateTemplate",
            "type": "_id_28"
          },
          {
            "name": "deliveryLocation",
            "type": "_id_159"
          },
          {
            "name": "deliveryLocation$_identifier"
          },
          {
            "name": "copyFromPO",
            "type": "_id_28"
          },
          {
            "name": "paymentMethod",
            "type": "_id_19"
          },
          {
            "name": "paymentMethod$_identifier"
          },
          {
            "name": "fINPaymentPriority",
            "type": "_id_19"
          },
          {
            "name": "fINPaymentPriority$_identifier"
          },
          {
            "name": "pickFromShipment",
            "type": "_id_28"
          },
          {
            "name": "receiveMaterials",
            "type": "_id_28"
          },
          {
            "name": "createInvoice",
            "type": "_id_28"
          },
          {
            "name": "returnReason",
            "type": "_id_19"
          },
          {
            "name": "returnReason$_identifier"
          },
          {
            "name": "addOrphanLine",
            "type": "_id_28"
          },
          {
            "name": "asset",
            "type": "_id_444F3B4F45544B9CA45E4035D49C1176"
          },
          {
            "name": "asset$_identifier"
          },
          {
            "name": "calculatePromotions",
            "type": "_id_28"
          },
          {
            "name": "costcenter",
            "type": "_id_DEE6B917B36D4648B2DA729FC2872CF4"
          },
          {
            "name": "costcenter$_identifier"
          },
          {
            "name": "createOrder",
            "type": "_id_28"
          },
          {
            "name": "rejectReason",
            "type": "_id_19"
          },
          {
            "name": "rejectReason$_identifier"
          },
          {
            "name": "validUntil",
            "type": "_id_15"
          },
          {
            "name": "quotation",
            "type": "_id_800062"
          },
          {
            "name": "quotation$_identifier"
          },
          {
            "name": "reservationStatus",
            "type": "_id_C3C19DE8AB3B42E78748E20D986FBBC9",
            "valueMap": {
              "CR": "Completely Reserved",
              "NR": "Not Reserved",
              "PR": "Partially Reserved"
            }
          },
          {
            "name": "createPOLines",
            "type": "_id_28"
          },
          {
            "name": "cashVAT",
            "type": "_id_20"
          },
          {
            "name": "pickfromreceipt",
            "type": "_id_28"
          },
          {
            "name": "cancelandreplace",
            "type": "_id_28"
          },
          {
            "name": "aPRMAddPayment",
            "type": "_id_28"
          },
          {
            "name": "confirmcancelandreplace",
            "type": "_id_28"
          },
          {
            "name": "cancelledorder",
            "type": "_id_290"
          },
          {
            "name": "cancelledorder$_identifier"
          },
          {
            "name": "replacedorder",
            "type": "_id_290"
          },
          {
            "name": "replacedorder$_identifier"
          },
          {
            "name": "iscancelled",
            "type": "_id_20"
          },
          {
            "name": "replacementorder",
            "type": "_id_290"
          },
          {
            "name": "replacementorder$_identifier"
          },
          {
            "name": "externalBusinessPartnerReference",
            "type": "_id_10"
          },
          {
            "name": "deliveryStatus",
            "type": "_id_11"
          },
          {
            "name": "invoiceStatus",
            "type": "_id_11"
          },
          {
            "name": "paymentStatus",
            "type": "_id_11"
          },
          {
            "additional": true,
            "name": "businessPartner$name",
            "type": "_id_10"
          },
          {
            "additional": true,
            "name": "warehouse$name",
            "type": "_id_10"
          }
        ],
        "requestProperties": {
          "params": {
            "_className": "OBViewDataSource",
            "Constants_FIELDSEPARATOR": "$",
            "Constants_IDENTIFIER": "_identifier"
          }
        }
      },
      "entity": "Order",
      "fields": [
        {
          "columnName": "AD_Org_ID",
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "editorProps": {
              "displayField": "_identifier",
              "valueField": "id"
            },
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "sort": 1
          },
          "hasDefaultValue": true,
          "id": "2052",
          "inpColumnName": "inpadOrgId",
          "name": "organization",
          "refColumnName": "AD_Org_ID",
          "required": true,
          "sessionProperty": true,
          "targetEntity": "Organization",
          "title": "Organization",
          "type": "_id_19",
          "updatable": false
        },
        {
          "columnName": "C_DocTypeTarget_ID",
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "displayProperty": "name",
            "editorProps": {
              "displayField": "_identifier",
              "valueField": "id"
            },
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "sort": 3
          },
          "id": "1085",
          "inpColumnName": "inpcDoctypetargetId",
          "name": "transactionDocument",
          "refColumnName": "C_DocType_ID",
          "required": true,
          "targetEntity": "DocumentType",
          "title": "Transaction Document",
          "type": "_id_22F546D49D3A48E1B2B4F50446A8DE58"
        },
        {
          "columnName": "DocumentNo",
          "gridProps": {
            "canFilter": true,
            "canSort": true,
            "displaylength": 10,
            "length": 30,
            "selectOnClick": true,
            "showHover": true,
            "sort": 2
          },
          "id": "1081",
          "inpColumnName": "inpdocumentno",
          "length": 30,
          "name": "documentNo",
          "required": true,
          "title": "Document No.",
          "type": "_id_10"
        },
        {
          "columnName": "DateOrdered",
          "gridProps": {
            "canFilter": true,
            "canSort": true,
            "cellAlign": "left",
            "filterOnKeypress": false,
            "selectOnClick": true,
            "showHover": true,
            "sort": 4
          },
          "hasDefaultValue": true,
          "id": "1093",
          "inpColumnName": "inpdateordered",
          "length": 10,
          "name": "orderDate",
          "required": true,
          "sessionProperty": true,
          "title": "Order Date",
          "type": "_id_15"
        },
        {
          "columnName": "C_BPartner_ID",
          "defaultPopupFilterField": "name",
          "displayField": "name",
          "extraSearchFields": ["value"],
          "firstFocusedField": true,
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "sort": 5
          },
          "id": "1573",
          "inpColumnName": "inpcBpartnerId",
          "name": "businessPartner",
          "outFields": {},
          "outHiddenInputPrefix": "inpcBpartnerId",
          "pickListFields": [
            {
              "name": "name",
              "title": " ",
              "type": "text"
            }
          ],
          "popupTextMatchStyle": "substring",
          "refColumnName": "C_BPartner_ID",
          "required": true,
          "selectorDefinitionId": "862F54CB1B074513BD791C6789F4AA42",
          "selectorGridFields": [
            {
              "name": "name",
              "showHover": true,
              "title": "Name",
              "type": "_id_10"
            },
            {
              "name": "value",
              "showHover": true,
              "title": "Value",
              "type": "_id_10"
            },
            {
              "filterOnKeypress": false,
              "name": "creditAvailable",
              "showHover": true,
              "title": "Credit Line available",
              "type": "_id_12"
            },
            {
              "filterOnKeypress": false,
              "name": "creditUsed",
              "showHover": true,
              "title": "Customer Balance",
              "type": "_id_12"
            },
            {
              "name": "customer",
              "showHover": true,
              "title": "Customer",
              "type": "_id_20"
            },
            {
              "name": "vendor",
              "showHover": true,
              "title": "Vendor",
              "type": "_id_20"
            },
            {
              "name": "category",
              "showHover": true,
              "title": "Category",
              "type": "_id_10"
            }
          ],
          "sessionProperty": true,
          "showSelectorGrid": true,
          "targetEntity": "BusinessPartner",
          "textMatchStyle": "substring",
          "title": "Business Partner",
          "type": "_id_800057",
          "valueField": "bpid"
        },
        {
          "columnName": "C_BPartner_Location_ID",
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "editorProps": {
              "displayField": "_identifier",
              "valueField": "id"
            },
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "sort": 6
          },
          "id": "2590",
          "inpColumnName": "inpcBpartnerLocationId",
          "name": "partnerAddress",
          "refColumnName": "C_BPartner_Location_ID",
          "required": true,
          "sessionProperty": true,
          "targetEntity": "BusinessPartnerLocation",
          "title": "Partner Address",
          "type": "_id_19"
        },
        {
          "columnName": "M_PriceList_ID",
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "editorProps": {
              "displayField": "_identifier",
              "valueField": "id"
            },
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 7
          },
          "id": "1077",
          "inpColumnName": "inpmPricelistId",
          "name": "priceList",
          "refColumnName": "M_PriceList_ID",
          "required": true,
          "sessionProperty": true,
          "targetEntity": "PricingPriceList",
          "title": "Price List",
          "type": "_id_19"
        },
        {
          "columnName": "DatePromised",
          "gridProps": {
            "canFilter": true,
            "canSort": true,
            "cellAlign": "left",
            "filterOnKeypress": false,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 9
          },
          "hasDefaultValue": true,
          "id": "1094",
          "inpColumnName": "inpdatepromised",
          "length": 10,
          "name": "scheduledDeliveryDate",
          "required": true,
          "sessionProperty": true,
          "title": "Scheduled Delivery Date",
          "type": "_id_15"
        },
        {
          "columnName": "FIN_Paymentmethod_ID",
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 32,
            "editorProps": {
              "displayField": "_identifier",
              "valueField": "id"
            },
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 11
          },
          "id": "830698140BBA4AC3E040007F01000289",
          "inpColumnName": "inpfinPaymentmethodId",
          "name": "paymentMethod",
          "refColumnName": "Fin_Paymentmethod_ID",
          "targetEntity": "FIN_PaymentMethod",
          "title": "Payment Method",
          "type": "_id_19"
        },
        {
          "columnName": "C_PaymentTerm_ID",
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "editorProps": {
              "displayField": "_identifier",
              "valueField": "id"
            },
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 13
          },
          "id": "1099",
          "inpColumnName": "inpcPaymenttermId",
          "name": "paymentTerms",
          "refColumnName": "C_PaymentTerm_ID",
          "required": true,
          "targetEntity": "FinancialMgmtPaymentTerm",
          "title": "Payment Terms",
          "type": "_id_19"
        },
        {
          "columnName": "M_Warehouse_ID",
          "defaultPopupFilterField": "name",
          "displayField": "name",
          "extraSearchFields": [],
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 15
          },
          "id": "1114",
          "inpColumnName": "inpmWarehouseId",
          "name": "warehouse",
          "outFields": {},
          "outHiddenInputPrefix": "inpmWarehouseId",
          "pickListFields": [
            {
              "name": "name",
              "title": " ",
              "type": "text"
            }
          ],
          "popupTextMatchStyle": "substring",
          "refColumnName": "M_Warehouse_ID",
          "required": true,
          "selectorDefinitionId": "F42A1DD1B941461EB3B9AD07A534D91E",
          "selectorGridFields": [
            {
              "name": "name",
              "showHover": true,
              "title": "name",
              "type": "_id_10"
            }
          ],
          "sessionProperty": true,
          "showSelectorGrid": true,
          "targetEntity": "Warehouse",
          "textMatchStyle": "startsWith",
          "title": "Warehouse",
          "type": "_id_263693E51C7847BF90C897ADB830E2BB",
          "valueField": "id"
        },
        {
          "columnName": "InvoiceRule",
          "gridProps": {
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "filterOnKeypress": false,
            "length": 60,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 17
          },
          "hasDefaultValue": true,
          "id": "1104",
          "inpColumnName": "inpinvoicerule",
          "name": "invoiceTerms",
          "required": true,
          "title": "Invoice Terms",
          "type": "_id_150"
        },
        {
          "defaultValue": "More Information",
          "itemIds": [
            "orderReference",
            "salesRepresentative",
            "description",
            "invoiceAddress",
            "deliveryLocation",
            "quotation",
            "cancelledorder",
            "replacedorder",
            "iscancelled",
            "externalBusinessPartnerReference"
          ],
          "name": "402880E72F1C15A5012F1C7AA98B00E8",
          "title": "More Information",
          "type": "OBSectionItem"
        },
        {
          "columnName": "POReference",
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 11,
            "length": 20,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 20
          },
          "id": "2111",
          "inpColumnName": "inpporeference",
          "length": 20,
          "name": "orderReference",
          "title": "Order Reference",
          "type": "_id_10"
        },
        {
          "columnName": "SalesRep_ID",
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "displayProperty": "name",
            "editorProps": {
              "displayField": "_identifier",
              "valueField": "id"
            },
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 21
          },
          "id": "1098",
          "inpColumnName": "inpsalesrepId",
          "name": "salesRepresentative",
          "refColumnName": "AD_User_ID",
          "targetEntity": "ADUser",
          "title": "Sales Representative",
          "type": "_id_190"
        },
        {
          "columnName": "Description",
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 60,
            "length": 255,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 22
          },
          "id": "1086",
          "inpColumnName": "inpdescription",
          "length": 255,
          "name": "description",
          "title": "Description",
          "type": "_id_10"
        },
        {
          "columnName": "BillTo_ID",
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "displayProperty": "name",
            "editorProps": {
              "displayField": "_identifier",
              "valueField": "id"
            },
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 23
          },
          "id": "1101",
          "inpColumnName": "inpbilltoId",
          "name": "invoiceAddress",
          "refColumnName": "C_BPartner_Location_ID",
          "required": true,
          "targetEntity": "BusinessPartnerLocation",
          "title": "Invoice Address",
          "type": "_id_159"
        },
        {
          "columnName": "Delivery_Location_ID",
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "displayProperty": "name",
            "editorProps": {
              "displayField": "_identifier",
              "valueField": "id"
            },
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 24
          },
          "id": "802711",
          "inpColumnName": "inpdeliveryLocationId",
          "name": "deliveryLocation",
          "refColumnName": "C_BPartner_Location_ID",
          "targetEntity": "BusinessPartnerLocation",
          "title": "Delivery Location",
          "type": "_id_159"
        },
        {
          "columnName": "Quotation_ID",
          "disabled": true,
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 32,
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 25
          },
          "id": "B21E042CE2E740B79EA8D6E29283298E",
          "inFields": [
            {
              "columnName": "inpadOrgId",
              "parameterName": "inpAD_Org_ID"
            }
          ],
          "inpColumnName": "inpquotationId",
          "name": "quotation",
          "outFields": [],
          "redrawOnChange": true,
          "refColumnName": "C_Order_ID",
          "searchUrl": "/info/SalesOrder.html",
          "targetEntity": "Order",
          "title": "Quotation",
          "type": "_id_800062",
          "updatable": false
        },
        {
          "columnName": "Cancelledorder_id",
          "disabled": true,
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "criteriaDisplayField": "documentNo",
            "criteriaField": "cancelledorder$documentNo",
            "displaylength": 32,
            "displayProperty": "documentNo",
            "editorProps": {
              "displayField": "_identifier",
              "valueField": "id"
            },
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 26
          },
          "id": "3C2B8257EC414EFBB6BA098C8400D28A",
          "inpColumnName": "inpcancelledorderId",
          "name": "cancelledorder",
          "redrawOnChange": true,
          "refColumnName": "C_Order_ID",
          "targetEntity": "Order",
          "title": "Canceled Order",
          "type": "_id_290"
        },
        {
          "columnName": "Replacedorder_id",
          "disabled": true,
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "criteriaDisplayField": "documentNo",
            "criteriaField": "replacedorder$documentNo",
            "displaylength": 32,
            "displayProperty": "documentNo",
            "editorProps": {
              "displayField": "_identifier",
              "valueField": "id"
            },
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 27
          },
          "id": "E7336543F2EA4658A48B719F833D43B6",
          "inpColumnName": "inpreplacedorderId",
          "name": "replacedorder",
          "redrawOnChange": true,
          "refColumnName": "C_Order_ID",
          "targetEntity": "Order",
          "title": "Replaced Order",
          "type": "_id_290"
        },
        {
          "columnName": "Iscancelled",
          "disabled": true,
          "gridProps": {
            "autoFitWidth": false,
            "canFilter": true,
            "canGroupBy": false,
            "canSort": true,
            "editorProps": {
              "showLabel": false,
              "showTitle": false
            },
            "selectOnClick": true,
            "showHover": true,
            "sort": 28,
            "width": "*",
            "yesNo": true
          },
          "hasDefaultValue": true,
          "id": "05E7C043CEC5432EBAFF1F3FD71A05E9",
          "inpColumnName": "inpiscancelled",
          "name": "iscancelled",
          "overflow": "visible",
          "redrawOnChange": true,
          "title": "Is Canceled",
          "type": "_id_20",
          "width": 1
        },
        {
          "columnName": "BPartner_ExtRef",
          "disabled": true,
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 256,
            "length": 256,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 34
          },
          "id": "206C498CBA9F49A78E8502EB2763406F",
          "inpColumnName": "inpbpartnerExtref",
          "length": 256,
          "name": "externalBusinessPartnerReference",
          "redrawOnChange": true,
          "title": "CRM Reference",
          "type": "_id_10"
        },
        {
          "defaultValue": "Dimensions",
          "itemIds": [
            "project",
            "costcenter",
            "asset",
            "stDimension",
            "ndDimension"
          ],
          "name": "800000",
          "sectionExpanded": true,
          "title": "Dimensions",
          "type": "OBSectionItem"
        },
        {
          "columnName": "C_Project_ID",
          "defaultPopupFilterField": "searchKey",
          "displayField": "_identifier",
          "extraSearchFields": ["searchKey", "name"],
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 29
          },
          "id": "2593",
          "inpColumnName": "inpcProjectId",
          "name": "project",
          "outFields": {},
          "outHiddenInputPrefix": "inpcProjectId",
          "pickListFields": [
            {
              "name": "_identifier",
              "title": " ",
              "type": "text"
            }
          ],
          "popupTextMatchStyle": "substring",
          "refColumnName": "C_Project_ID",
          "selectorDefinitionId": "A35B6EC33A2243018915908AEB1B3F5E",
          "selectorGridFields": [
            {
              "name": "searchKey",
              "showHover": true,
              "title": "Search Key",
              "type": "_id_10"
            },
            {
              "name": "name",
              "showHover": true,
              "title": "Name",
              "type": "_id_10"
            },
            {
              "filterOnKeypress": false,
              "name": "projectStatus",
              "showHover": true,
              "title": "Project Status",
              "type": "_id_800002",
              "valueMap": {
                "OC": "Order closed",
                "OP": "Open",
                "OR": "Order"
              }
            },
            {
              "displayField": "businessPartner$_identifier",
              "name": "businessPartner",
              "showHover": true,
              "title": "Business Partner",
              "type": "_id_800057"
            }
          ],
          "showSelectorGrid": true,
          "targetEntity": "Project",
          "textMatchStyle": "substring",
          "title": "Project",
          "type": "_id_800061",
          "valueField": "id"
        },
        {
          "columnName": "C_Costcenter_ID",
          "defaultPopupFilterField": "name",
          "displayField": "_identifier",
          "extraSearchFields": [],
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 32,
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 30
          },
          "id": "F8EDB03F17DF4EDBAA54A4E6ECEE0796",
          "inpColumnName": "inpcCostcenterId",
          "name": "costcenter",
          "outFields": {},
          "outHiddenInputPrefix": "inpcCostcenterId",
          "pickListFields": [
            {
              "name": "_identifier",
              "title": " ",
              "type": "text"
            }
          ],
          "popupTextMatchStyle": "substring",
          "refColumnName": "C_Costcenter_ID",
          "selectorDefinitionId": "B8321631F57E463EB617289E936BAF3A",
          "selectorGridFields": [
            {
              "name": "searchKey",
              "showHover": true,
              "title": "Search Key",
              "type": "_id_10"
            },
            {
              "name": "name",
              "showHover": true,
              "title": "Name",
              "type": "_id_10"
            }
          ],
          "showSelectorGrid": true,
          "targetEntity": "Costcenter",
          "textMatchStyle": "substring",
          "title": "Cost Center",
          "type": "_id_DEE6B917B36D4648B2DA729FC2872CF4",
          "valueField": "id"
        },
        {
          "columnName": "A_Asset_ID",
          "defaultPopupFilterField": "name",
          "displayField": "_identifier",
          "extraSearchFields": [],
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 32,
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 31
          },
          "id": "48DEE27C5EE849B99C2B150479239A0E",
          "inpColumnName": "inpaAssetId",
          "name": "asset",
          "outFields": {},
          "outHiddenInputPrefix": "inpaAssetId",
          "pickListFields": [
            {
              "name": "_identifier",
              "title": " ",
              "type": "text"
            }
          ],
          "popupTextMatchStyle": "substring",
          "refColumnName": "A_Asset_ID",
          "selectorDefinitionId": "E65052A724B3451CA643A0CC355CEA40",
          "selectorGridFields": [
            {
              "name": "searchKey",
              "showHover": true,
              "title": "Search Key",
              "type": "_id_10"
            },
            {
              "name": "name",
              "showHover": true,
              "title": "Name",
              "type": "_id_10"
            }
          ],
          "showSelectorGrid": true,
          "targetEntity": "FinancialMgmtAsset",
          "textMatchStyle": "startsWith",
          "title": "Asset",
          "type": "_id_444F3B4F45544B9CA45E4035D49C1176",
          "valueField": "id"
        },
        {
          "columnName": "User1_ID",
          "defaultPopupFilterField": "name",
          "displayField": "_identifier",
          "extraSearchFields": [],
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 32
          },
          "id": "7826",
          "inpColumnName": "inpuser1Id",
          "name": "stDimension",
          "outFields": {},
          "outHiddenInputPrefix": "inpuser1Id",
          "pickListFields": [
            {
              "name": "_identifier",
              "title": " ",
              "type": "text"
            }
          ],
          "popupTextMatchStyle": "substring",
          "refColumnName": "User1_ID",
          "selectorDefinitionId": "814758DD755642E9BF38BD2E5AD713EC",
          "selectorGridFields": [
            {
              "name": "searchKey",
              "showHover": true,
              "title": "Search Key",
              "type": "_id_10"
            },
            {
              "name": "name",
              "showHover": true,
              "title": "Name",
              "type": "_id_10"
            }
          ],
          "showSelectorGrid": true,
          "targetEntity": "UserDimension1",
          "textMatchStyle": "substring",
          "title": "1st Dimension",
          "type": "_id_0E0D1661E18E4E05A118785A7CF146B8",
          "valueField": "id"
        },
        {
          "columnName": "User2_ID",
          "defaultPopupFilterField": "name",
          "displayField": "_identifier",
          "extraSearchFields": [],
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 33
          },
          "id": "7825",
          "inpColumnName": "inpuser2Id",
          "name": "ndDimension",
          "outFields": {},
          "outHiddenInputPrefix": "inpuser2Id",
          "pickListFields": [
            {
              "name": "_identifier",
              "title": " ",
              "type": "text"
            }
          ],
          "popupTextMatchStyle": "substring",
          "refColumnName": "User2_ID",
          "selectorDefinitionId": "BD1DA40E134A42B9889B529302A96871",
          "selectorGridFields": [
            {
              "name": "searchKey",
              "showHover": true,
              "title": "Search Key",
              "type": "_id_10"
            },
            {
              "name": "name",
              "showHover": true,
              "title": "Name",
              "type": "_id_10"
            }
          ],
          "showSelectorGrid": true,
          "targetEntity": "UserDimension2",
          "textMatchStyle": "substring",
          "title": "2nd Dimension",
          "type": "_id_1850A5390D97470EBB35A3A5F43AB533",
          "valueField": "id"
        },
        {
          "defaultValue": "Audit",
          "itemIds": ["creationDate", "createdBy", "updated", "updatedBy"],
          "name": "1000100001",
          "personalizable": false,
          "title": "Audit",
          "type": "OBAuditSectionItem"
        },
        {
          "disabled": true,
          "gridProps": {
            "canFilter": true,
            "canSort": true,
            "cellAlign": "left",
            "showHover": true,
            "showIf": "false",
            "sort": 990
          },
          "name": "creationDate",
          "personalizable": false,
          "title": "Creation Date",
          "type": "_id_16",
          "updatable": false
        },
        {
          "disabled": true,
          "displayField": "createdBy$_identifier",
          "gridProps": {
            "canFilter": true,
            "canSort": true,
            "cellAlign": "left",
            "fkField": true,
            "showHover": true,
            "showIf": "false",
            "sort": 990
          },
          "name": "createdBy",
          "personalizable": false,
          "targetEntity": "User",
          "title": "Created By",
          "type": "_id_30",
          "updatable": false
        },
        {
          "disabled": true,
          "gridProps": {
            "canFilter": true,
            "canSort": true,
            "cellAlign": "left",
            "showHover": true,
            "showIf": "false",
            "sort": 990
          },
          "name": "updated",
          "personalizable": false,
          "title": "Updated",
          "type": "_id_16",
          "updatable": false
        },
        {
          "disabled": true,
          "displayField": "updatedBy$_identifier",
          "gridProps": {
            "canFilter": true,
            "canSort": true,
            "cellAlign": "left",
            "fkField": true,
            "showHover": true,
            "showIf": "false",
            "sort": 990
          },
          "name": "updatedBy",
          "personalizable": false,
          "targetEntity": "User",
          "title": "Updated By",
          "type": "_id_30",
          "updatable": false
        },
        {
          "name": "_notes_",
          "personalizable": false,
          "type": "OBNoteSectionItem"
        },
        {
          "name": "_notes_Canvas",
          "personalizable": false,
          "type": "OBNoteCanvasItem"
        },
        {
          "name": "_linkedItems_",
          "personalizable": false,
          "type": "OBLinkedItemSectionItem"
        },
        {
          "name": "_linkedItems_Canvas",
          "personalizable": false,
          "type": "OBLinkedItemCanvasItem"
        },
        {
          "name": "_attachments_",
          "personalizable": false,
          "type": "OBAttachmentsSectionItem"
        },
        {
          "name": "_attachments_Canvas",
          "personalizable": false,
          "type": "OBAttachmentCanvasItem"
        },
        {
          "columnName": "DocStatus",
          "disabled": true,
          "displayed": false,
          "gridProps": {
            "canFilter": true,
            "canSort": true,
            "displaylength": 21,
            "filterOnKeypress": false,
            "length": 60,
            "selectOnClick": true,
            "showHover": true,
            "sort": 12
          },
          "hasDefaultValue": true,
          "inpColumnName": "inpdocstatus",
          "name": "documentStatus",
          "required": true,
          "sessionProperty": true,
          "title": "Document Status",
          "type": "_id_FF80818130217A350130218D802B0011",
          "updatable": false
        },
        {
          "columnName": "GrandTotal",
          "disabled": true,
          "displayed": false,
          "gridProps": {
            "canFilter": true,
            "canSort": true,
            "filterOnKeypress": false,
            "selectOnClick": true,
            "showHover": true,
            "sort": 8
          },
          "inpColumnName": "inpgrandtotal",
          "name": "grandTotalAmount",
          "required": true,
          "sessionProperty": true,
          "title": "Total Gross Amount",
          "type": "_id_12",
          "updatable": false
        },
        {
          "columnName": "TotalLines",
          "disabled": true,
          "displayed": false,
          "gridProps": {
            "canFilter": true,
            "canSort": true,
            "filterOnKeypress": false,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 18
          },
          "inpColumnName": "inptotallines",
          "name": "summedLineAmount",
          "required": true,
          "title": "Total Net Amount",
          "type": "_id_12",
          "updatable": false
        },
        {
          "columnName": "C_Currency_ID",
          "disabled": true,
          "displayed": false,
          "gridProps": {
            "autoExpand": true,
            "canFilter": true,
            "canSort": true,
            "displaylength": 44,
            "editorProps": {
              "displayField": "_identifier",
              "valueField": "id"
            },
            "filterEditorProperties": {
              "keyProperty": "id"
            },
            "fkField": true,
            "selectOnClick": true,
            "showHover": true,
            "sort": 10
          },
          "hasDefaultValue": true,
          "inpColumnName": "inpcCurrencyId",
          "name": "currency",
          "refColumnName": "C_Currency_ID",
          "required": true,
          "sessionProperty": true,
          "targetEntity": "Currency",
          "title": "Currency",
          "type": "_id_19",
          "updatable": false
        },
        {
          "columnName": "SO_Res_Status",
          "disabled": true,
          "displayed": false,
          "gridProps": {
            "canFilter": true,
            "canSort": true,
            "displaylength": 60,
            "filterOnKeypress": false,
            "length": 60,
            "selectOnClick": true,
            "showHover": true,
            "showIf": "false",
            "sort": 19
          },
          "inpColumnName": "inpsoResStatus",
          "name": "reservationStatus",
          "title": "Reservation Status",
          "type": "_id_C3C19DE8AB3B42E78748E20D986FBBC9"
        },
        {
          "clientClass": "OBAddPercentageSign",
          "columnName": "DeliveryStatus",
          "disabled": true,
          "displayed": false,
          "editorType": "OBClientClassCanvasItem",
          "gridProps": {
            "canFilter": false,
            "canSort": false,
            "filterOnKeypress": false,
            "selectOnClick": true,
            "showHover": true,
            "sort": 14
          },
          "inpColumnName": "inpdeliverystatus",
          "isComputedColumn": true,
          "name": "deliveryStatus",
          "title": "Delivery Status",
          "type": "_id_11",
          "updatable": false
        },
        {
          "clientClass": "OBAddPercentageSign",
          "columnName": "InvoiceStatus",
          "disabled": true,
          "displayed": false,
          "editorType": "OBClientClassCanvasItem",
          "gridProps": {
            "canFilter": false,
            "canSort": false,
            "filterOnKeypress": false,
            "selectOnClick": true,
            "showHover": true,
            "sort": 16
          },
          "inpColumnName": "inpinvoicestatus",
          "isComputedColumn": true,
          "name": "invoiceStatus",
          "title": "Invoice Status",
          "type": "_id_11"
        },
        {
          "columnName": "IsDelivered",
          "disabled": true,
          "displayed": false,
          "gridProps": {
            "autoFitWidth": false,
            "canFilter": true,
            "canGroupBy": false,
            "canSort": true,
            "editorProps": {
              "showLabel": false,
              "showTitle": false
            },
            "selectOnClick": true,
            "showHover": true,
            "sort": 35,
            "width": "*",
            "yesNo": true
          },
          "inpColumnName": "inpisdelivered",
          "name": "delivered",
          "overflow": "visible",
          "title": "Delivered",
          "type": "_id_20",
          "updatable": false,
          "width": 1
        }
      ],
      "hasChildTabs": true,
      "iconToolbarButtons": [
        {
          "buttonType": "print",
          "isProcessDefinition": false,
          "prompt": "Print Record"
        },
        {
          "buttonType": "email",
          "isProcessDefinition": false,
          "prompt": "Email"
        }
      ],
      "initialPropertyToColumns": [
        {
          "dbColumn": "C_Return_Reason_ID",
          "inpColumn": "inpcReturnReasonId",
          "property": "returnReason",
          "type": "_id_19"
        },
        {
          "dbColumn": "RM_PickFromShipment",
          "inpColumn": "inprmPickfromshipment",
          "property": "pickFromShipment",
          "type": "_id_28"
        },
        {
          "dbColumn": "RM_ReceiveMaterials",
          "inpColumn": "inprmReceivematerials",
          "property": "receiveMaterials",
          "type": "_id_28"
        },
        {
          "dbColumn": "RM_CreateInvoice",
          "inpColumn": "inprmCreateinvoice",
          "property": "createInvoice",
          "type": "_id_28"
        },
        {
          "dbColumn": "TotalLines",
          "inpColumn": "inptotallines",
          "property": "summedLineAmount",
          "type": "_id_12"
        },
        {
          "dbColumn": "AD_User_ID",
          "inpColumn": "inpadUserId",
          "property": "userContact",
          "type": "_id_19"
        },
        {
          "dbColumn": "C_DocType_ID",
          "inpColumn": "inpcDoctypeId",
          "property": "documentType",
          "sessionProperty": true,
          "type": "_id_19"
        },
        {
          "dbColumn": "SO_Res_Status",
          "inpColumn": "inpsoResStatus",
          "property": "reservationStatus",
          "type": "_id_C3C19DE8AB3B42E78748E20D986FBBC9"
        },
        {
          "dbColumn": "EM_APRM_AddPayment",
          "inpColumn": "inpemAprmAddpayment",
          "property": "aPRMAddPayment",
          "type": "_id_28"
        },
        {
          "dbColumn": "DocAction",
          "inpColumn": "inpdocaction",
          "property": "documentAction",
          "type": "_id_FF80818130217A35013021A672400035"
        },
        {
          "dbColumn": "CopyFrom",
          "inpColumn": "inpcopyfrom",
          "property": "copyFrom",
          "type": "_id_28"
        },
        {
          "dbColumn": "CopyFromPO",
          "inpColumn": "inpcopyfrompo",
          "property": "copyFromPO",
          "type": "_id_28"
        },
        {
          "dbColumn": "DeliveryViaRule",
          "inpColumn": "inpdeliveryviarule",
          "property": "deliveryMethod",
          "sessionProperty": true,
          "type": "_id_152"
        },
        {
          "dbColumn": "M_Shipper_ID",
          "inpColumn": "inpmShipperId",
          "property": "shippingCompany",
          "sessionProperty": true,
          "type": "_id_19"
        },
        {
          "dbColumn": "DeliveryRule",
          "inpColumn": "inpdeliveryrule",
          "property": "deliveryTerms",
          "type": "_id_151"
        },
        {
          "dbColumn": "FreightCostRule",
          "inpColumn": "inpfreightcostrule",
          "property": "freightCostRule",
          "sessionProperty": true,
          "type": "_id_153"
        },
        {
          "dbColumn": "FreightAmt",
          "inpColumn": "inpfreightamt",
          "property": "freightAmount",
          "type": "_id_12"
        },
        {
          "dbColumn": "IsDiscountPrinted",
          "inpColumn": "inpisdiscountprinted",
          "property": "printDiscount",
          "type": "_id_20"
        },
        {
          "dbColumn": "PriorityRule",
          "inpColumn": "inppriorityrule",
          "property": "priority",
          "type": "_id_154"
        },
        {
          "dbColumn": "C_Campaign_ID",
          "inpColumn": "inpcCampaignId",
          "property": "salesCampaign",
          "type": "_id_19"
        },
        {
          "dbColumn": "ChargeAmt",
          "inpColumn": "inpchargeamt",
          "property": "chargeAmount",
          "type": "_id_12"
        },
        {
          "dbColumn": "C_Charge_ID",
          "inpColumn": "inpcChargeId",
          "property": "charge",
          "type": "_id_200"
        },
        {
          "dbColumn": "C_Activity_ID",
          "inpColumn": "inpcActivityId",
          "property": "activity",
          "type": "_id_19"
        },
        {
          "dbColumn": "AD_OrgTrx_ID",
          "inpColumn": "inpadOrgtrxId",
          "property": "trxOrganization",
          "type": "_id_130"
        },
        {
          "dbColumn": "Calculate_Promotions",
          "inpColumn": "inpcalculatePromotions",
          "property": "calculatePromotions",
          "type": "_id_28"
        },
        {
          "dbColumn": "RM_AddOrphanLine",
          "inpColumn": "inprmAddorphanline",
          "property": "addOrphanLine",
          "type": "_id_28"
        },
        {
          "dbColumn": "Convertquotation",
          "inpColumn": "inpconvertquotation",
          "property": "createOrder",
          "type": "_id_28"
        },
        {
          "dbColumn": "C_Reject_Reason_ID",
          "inpColumn": "inpcRejectReasonId",
          "property": "rejectReason",
          "type": "_id_19"
        },
        {
          "dbColumn": "validuntil",
          "inpColumn": "inpvaliduntil",
          "property": "validUntil",
          "type": "_id_15"
        },
        {
          "dbColumn": "Replacementorder_ID",
          "inpColumn": "inpreplacementorderId",
          "property": "replacementorder",
          "sessionProperty": true,
          "type": "_id_290"
        },
        {
          "dbColumn": "Cancelandreplace",
          "inpColumn": "inpcancelandreplace",
          "property": "cancelandreplace",
          "type": "_id_28"
        },
        {
          "dbColumn": "PaymentStatus",
          "inpColumn": "inppaymentstatus",
          "property": "paymentStatus",
          "type": "_id_11"
        },
        {
          "dbColumn": "Confirmcancelandreplace",
          "inpColumn": "inpconfirmcancelandreplace",
          "property": "confirmcancelandreplace",
          "type": "_id_28"
        },
        {
          "dbColumn": "C_Order_ID",
          "inpColumn": "inpcOrderId",
          "property": "id",
          "sessionProperty": true,
          "type": "_id_13"
        },
        {
          "dbColumn": "AD_Client_ID",
          "inpColumn": "inpadClientId",
          "property": "client",
          "sessionProperty": true,
          "type": "_id_19"
        },
        {
          "dbColumn": "IsActive",
          "inpColumn": "inpisactive",
          "property": "active",
          "type": "_id_20"
        },
        {
          "dbColumn": "IsInvoiced",
          "inpColumn": "inpisinvoiced",
          "property": "reinvoice",
          "type": "_id_20"
        },
        {
          "dbColumn": "IsPrinted",
          "inpColumn": "inpisprinted",
          "property": "print",
          "type": "_id_20"
        },
        {
          "dbColumn": "DateAcct",
          "inpColumn": "inpdateacct",
          "property": "accountingDate",
          "type": "_id_15"
        },
        {
          "dbColumn": "Processing",
          "inpColumn": "inpprocessing",
          "property": "processNow",
          "type": "_id_28"
        },
        {
          "dbColumn": "Processed",
          "inpColumn": "inpprocessed",
          "property": "processed",
          "sessionProperty": true,
          "type": "_id_20"
        },
        {
          "dbColumn": "DatePrinted",
          "inpColumn": "inpdateprinted",
          "property": "datePrinted",
          "type": "_id_15"
        },
        {
          "dbColumn": "IsSOTrx",
          "inpColumn": "inpissotrx",
          "property": "salesTransaction",
          "sessionProperty": true,
          "type": "_id_20"
        },
        {
          "dbColumn": "PaymentRule",
          "inpColumn": "inppaymentrule",
          "property": "formOfPayment",
          "type": "_id_195"
        },
        {
          "dbColumn": "Posted",
          "inpColumn": "inpposted",
          "property": "posted",
          "sessionProperty": true,
          "type": "_id_234"
        },
        {
          "dbColumn": "IsTaxIncluded",
          "inpColumn": "inpistaxincluded",
          "property": "priceIncludesTax",
          "type": "_id_20"
        },
        {
          "dbColumn": "IsSelected",
          "inpColumn": "inpisselected",
          "property": "selected",
          "type": "_id_20"
        },
        {
          "dbColumn": "DropShip_User_ID",
          "inpColumn": "inpdropshipUserId",
          "property": "dropShipContact",
          "type": "_id_110"
        },
        {
          "dbColumn": "DropShip_BPartner_ID",
          "inpColumn": "inpdropshipBpartnerId",
          "property": "dropShipPartner",
          "type": "_id_FF9658201F8B4BE780BE00AAA9499ED5"
        },
        {
          "dbColumn": "DropShip_Location_ID",
          "inpColumn": "inpdropshipLocationId",
          "property": "dropShipLocation",
          "type": "_id_159"
        },
        {
          "dbColumn": "IsSelfService",
          "inpColumn": "inpisselfservice",
          "property": "selfService",
          "type": "_id_20"
        },
        {
          "dbColumn": "Generatetemplate",
          "inpColumn": "inpgeneratetemplate",
          "property": "generateTemplate",
          "type": "_id_28"
        },
        {
          "dbColumn": "Deliverynotes",
          "inpColumn": "inpdeliverynotes",
          "property": "deliveryNotes",
          "type": "_id_14"
        },
        {
          "dbColumn": "C_Incoterms_ID",
          "inpColumn": "inpcIncotermsId",
          "property": "incoterms",
          "type": "_id_19"
        },
        {
          "dbColumn": "Incotermsdescription",
          "inpColumn": "inpincotermsdescription",
          "property": "iNCOTERMSDescription",
          "type": "_id_14"
        },
        {
          "dbColumn": "C_Order_ID",
          "inpColumn": "C_Order_ID",
          "property": "id",
          "sessionProperty": true,
          "type": "_id_13"
        }
      ],
      "isDeleteableTable": true,
      "mapping250": "/SalesOrder/Header",
      "moduleId": "0",
      "notesDataSource": {
        "createClassName": "",
        "dataURL": "/etendo/org.openbravo.service.datasource/090A37D22E61FE94012E621729090048",
        "fields": [
          {
            "name": "id",
            "primaryKey": true,
            "type": "_id_13"
          },
          {
            "name": "client",
            "type": "_id_19"
          },
          {
            "name": "client$_identifier"
          },
          {
            "name": "organization",
            "type": "_id_19"
          },
          {
            "name": "organization$_identifier"
          },
          {
            "name": "table",
            "type": "_id_19"
          },
          {
            "name": "table$_identifier"
          },
          {
            "name": "record",
            "type": "_id_10"
          },
          {
            "name": "note",
            "type": "_id_14"
          },
          {
            "name": "isactive",
            "type": "_id_20"
          },
          {
            "name": "creationDate",
            "type": "_id_16"
          },
          {
            "name": "createdBy",
            "type": "_id_30"
          },
          {
            "name": "createdBy$_identifier"
          },
          {
            "name": "updated",
            "type": "_id_16"
          },
          {
            "name": "updatedBy",
            "type": "_id_30"
          },
          {
            "name": "updatedBy$_identifier"
          }
        ],
        "potentiallyShared": true,
        "requestProperties": {
          "params": {
            "Constants_FIELDSEPARATOR": "$",
            "Constants_IDENTIFIER": "_identifier"
          }
        }
      },
      "showCloneButton": true,
      "showParentButtons": true,
      "standardProperties": {
        "inpkeyColumnId": "C_Order_ID",
        "inpKeyName": "inpcOrderId",
        "inpTabId": "186",
        "inpTableId": "259",
        "inpwindowId": "143",
        "keyColumnName": "C_Order_ID",
        "keyProperty": "id",
        "keyPropertyType": "_id_13"
      },
      "statusBarFields": [
        "documentStatus",
        "grandTotalAmount",
        "summedLineAmount",
        "currency",
        "reservationStatus",
        "deliveryStatus",
        "invoiceStatus",
        "delivered"
      ],
      "tabId": "186",
      "tabTitle": "Header",
      "viewGrid": {
        "allowSummaryFunctions": true,
        "filterClause": true,
        "filterName": "This grid is filtered using a transactional filter <i>(only draft & modified documents in the last 1 day(s))</i>.",
        "requiredGridProperties": [
          "id",
          "client",
          "organization",
          "updatedBy",
          "updated",
          "creationDate",
          "createdBy",
          "documentNo",
          "orderDate",
          "grandTotalAmount",
          "aPRMAddPayment",
          "documentAction",
          "copyFrom",
          "copyFromPO",
          "calculatePromotions",
          "cancelandreplace",
          "confirmcancelandreplace",
          "processNow",
          "posted",
          "generateTemplate",
          "Replacementorder_ID",
          "processed",
          "grandTotalAmount",
          "documentStatus",
          "cancelledorder",
          "iscancelled",
          "quotation",
          "cancelledorder",
          "replacedorder",
          "externalBusinessPartnerReference",
          "organization",
          "orderDate",
          "businessPartner",
          "partnerAddress",
          "priceList",
          "scheduledDeliveryDate",
          "warehouse",
          "documentStatus",
          "grandTotalAmount",
          "currency",
          "documentType",
          "deliveryMethod",
          "shippingCompany",
          "freightCostRule",
          "replacementorder",
          "id",
          "client",
          "processed",
          "salesTransaction",
          "posted",
          "transactionDocument",
          "transactionDocument",
          "id",
          "client",
          "id",
          "processNow",
          "processed"
        ],
        "sortField": "documentNo",
        "uiPattern": "STD"
      },
      "windowId": "143"
    },
    "windowId": "143"
  }
}

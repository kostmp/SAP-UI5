sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/m/Label',
    "sap/ui/model/odata/v2/ODataModel",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/comp/smartvariants/PersonalizableInfo',
    "sap/ui/export/Spreadsheet"
], function(Controller, ODataModel, Label, Filter, FilterOperator, PersonalizableInfo,Spreadsheet) {
	"use strict";

	return Controller.extend("zbouzios2.controller.View1", {
		onInit: function() {
            
		},
        onExportPress: function () {
            let oTable = this.getView().byId("table"); // Replace 'yourTableId' with the actual ID of your table
            let oModel = oTable.getModel();
            let aData = oTable.getBinding("rows").getContexts().map(function (oContext) {
                let oData = oContext.getObject();
                return {
                    Product: oData.Product,
                    ProductType: oData.ProductType,
                    CreationDate: oData.CreationDate,
                    GrossWeight: oData.GrossWeight,
                    WeightUnit: oData.WeightUnit,
                    NetWeight: oData.NetWeight,
                    ProductGroup: oData.ProductGroup,
                    ItemCategoryGroup: oData.ItemCategoryGroup
                };
            });

            let aColumns = [
                {label: 'Product', property: 'Product', type: 'String'},
                {label: 'Product Type', property: 'ProductType', type: 'String'},
                {label: 'Creation Date', property: 'CreationDate', type: 'Date'},
                {label: 'Gross Weight', property: 'GrossWeight', type: 'Number'},
                {label: 'Weight Unit', property: 'WeightUnit', type: 'String'},
                {label: 'Net Weight', property: 'NetWeight', type: 'Number'},
                {label: 'Product Group', property: 'ProductGroup', type: 'String'},
                {label: 'Item Category Group', property: 'ItemCategoryGroup', type: 'String'},
            ];
            let oSettings = {
                workbook: { columns: aColumns },
                dataSource: aData,
                fileName: 'ExportedData.xlsx'
            };
        
            let oSheet = new sap.ui.export.Spreadsheet(oSettings);
            oSheet.build().finally(function () {
                oSheet.destroy();
            });
        },
        onModifyPress: function() {
            let oTable = this.byId("table"); 
            //let tableRows = oTable.getRows();
            let aSelectedIndices = oTable.getSelectedIndices(); 
        
            // Loop through selected rows
            aSelectedIndices.forEach(function(iIndex) {
                let oRow = oTable.getRows()[iIndex]; 
                let aCells = oRow.getCells();
                aCells.forEach(function(index) {
                    index.setEditable(true);
                });
                aCells[0].setEditable(false);
            });
        },

        onSavePress: async function() {
            let oTable = this.byId("table"); 
            let aSelectedIndices = oTable.getSelectedIndices(); 
            let oModel = await this.getOwnerComponent().getModel();
            aSelectedIndices.forEach(async function(iIndex) {
                let oRow = oTable.getRows()[iIndex]; 
                let aCells = oRow.getCells();
                let Gross = aCells[3].getValue().replace(/\./g, '');
                let Net = aCells[5].getValue().replace(/\./g, '');
                // Replace the decimal separator ',' with '.'
                let Grossweight = Gross.replace(',', '.');
                let Netweight = Net.replace(',', '.');
                const oUpdatedData = {
                    ProductType: aCells[1].getValue(),
                    //CreationDate: aCells[2].getValue(),
                    GrossWeight: Grossweight,//aCells[3].getValue(),
                    WeightUnit: aCells[4].getValue(),
                    NetWeight: Netweight,//aCells[5].getValue(),
                    ProductGroup: aCells[6].getValue(),
                    ItemCategoryGroup: aCells[7].getValue()
                };
                const productId = aCells[0].getValue();
                const sEntitySet = "/A_Product('" + productId +"')";
                // jQuery.ajax({
                //     url: sEntitySet,
                //     type: "PATCH",
                //     data: JSON.stringify(oUpdatedData),
                //     contentType: "application/json",
                //     success: function() {
                //         sap.m.MessageToast.show("Update successful");
                //     },
                //     error: function() {
                //         sap.m.MessageToast.show("Update failed");
                //     }
                // });
                
                oModel.update(sEntitySet, oUpdatedData,{
                    success: function() {
                        sap.m.MessageToast.show("Entity updated successfully");
                    },
                    error: function(oError) {
                        sap.m.MessageToast.show("Update failed");
                    }
                });
                aCells.forEach(function(index) {
                    index.setEditable(false);
                });

            });
        },

		onSearch: function (oEvent) {
            let oFilterProduct = this.byId("inputProduct");
            let oFilterProductType = this.byId("inputProductType");
            let oFilterCreationDate = this.byId("inputCreationDate");

            console.log("Filter Values:", {
                product: oFilterProduct.getValue(),
                productType: oFilterProductType.getValue(),
                creationDate: oFilterCreationDate.getValue(),
            });

            let oParams = {
                filters: [
                    new sap.ui.model.Filter("Product", sap.ui.model.FilterOperator.EQ, oFilterProduct.getValue()),
                    new sap.ui.model.Filter("ProductType", sap.ui.model.FilterOperator.EQ, oFilterProductType.getValue()),
                    new sap.ui.model.Filter("CreationDate", sap.ui.model.FilterOperator.EQ, oFilterCreationDate.getValue())
                ]
            };
            const aFilters = [];
        
            if (oFilterProduct.getValue()) {
                aFilters.push(new sap.ui.model.Filter("Product", "EQ", oFilterProduct.getValue()));
            }
            if (oFilterProductType.getValue()) {
                aFilters.push(new sap.ui.model.Filter("ProductType", "EQ", oFilterProductType.getValue()));
            }
            if (oFilterCreationDate.getValue()) {
                aFilters.push(new sap.ui.model.Filter("CreationDate", "EQ", oFilterCreationDate.getValue()));
            }
        
            let oCombinedFilter = new sap.ui.model.Filter({
                filters: aFilters,
                and: true
            });
            let oTable = this.byId("table");
           // const ofilterProduct = await this.loadFragment({
             //   name: "zbouzios2.view.FilterProduct"
            //});  
            oTable.bindRows({
                path: "/A_Product",
                template: oTable.getBindingInfo("rows").template,
                filters: [oCombinedFilter],
            });

            // this.getOwnerComponent().getModel().APIGet("/A_Product", {
            //     filters: [oCombinedFilter],
            //     success: function(oData) {
            //         console.log(oData);
            //         let oModel = new sap.ui.model.json.JSONModel();
            //         oModel.setData(oData);
            //         oTable.setModel(oModel);
            //         oTable.bindItems({
            //             template: oTable.getBindingInfo("items").template
            //         });
            //     },
            //     error: function() {
            //         alert("Failed to fetch data from the API.");
            //     }
            // });

		}
	});
});
let apiHelper = require('./components/api-helper');
let InternalError = require('../error/InternalError');
let logger = require('../plugins/Logger');
let receiptService = require("../service/receipt-service");
let userService = require("../service/user-service");
let productService = require("../service/product-service");
let moment = require('moment');

let receiptAPI = {
    createReceipt: async function(req, res){
        try{
            apiHelper.preProcess(req,
                {mandatory: ['user_id', 'purchase_date', 'total_amount', 'merchant', 'postcode'],
                        optional: ['comment']}, null);

            let userID = req.body.user_id;
            let purchaseDate = req.body.purchase_date;
            let totalAmount = req.body.total_amount;
            let merchant = req.body.merchant;
            let postcode = req.body.postcode;

            let userInfo = await userService.retrieveUser(userID);
            if(!userInfo){
                throw new InternalError(`Nonexistent user ID ${userID}`, InternalError.Types.UserError);
            }

            let now = moment().format("YYYY-MM-DD");
            if(moment(purchaseDate).format("YYYY-MM-DD") > now){
                throw new InternalError(`Invalid purchase time ${purchaseDate}, larger than than current timestamp`, InternalError.Types.UserError);
            }

            if(parseInt(totalAmount) <= 0){
                throw new InternalError(`Non-positive total amount`, InternalError.Types.UserError);
            }

            logger.debug(`Prepare to create new receipt for user ${userID}, receipt detail: ${JSON.stringify(req.body)}`);

            let result = await receiptService.createReceipt(userID, purchaseDate, totalAmount, merchant, postcode);
            let data = {
                result: 'success',
                message: 'Receipt is created successfully',
                receiptInfo: result
            };
            apiHelper.sendAPISuccess(req, res, data);
        }catch(e){
            apiHelper.sendAPIFailure(req, res, e);
        }
    },
    retrieveAllReceipt: async function(){

    },
    retrieveReceipt: async function(){

    },
    deleteReceipt: async function(req, res){
        try{
            apiHelper.preProcess(req,null,null);

            let receiptID = req.params.receiptID;
            let result = await receiptService.deleteReceiptWithAssociatedProducts(receiptID);
            logger.debug(`Prepare to delete receipt with ID ${receiptID}`);

            if(result){
                let data = {
                    result: 'success',
                    message: 'Receipt and associated products are deleted successfully'
                };
                apiHelper.sendAPISuccess(req, res, data);
            }else{
                throw new InternalError(`Nonexitent receipt with ID ${receiptID} cannot be deleted`, InternalError.Types.UserError);
            }
        }catch(e){
            apiHelper.sendAPIFailure(req, res, e);
        }
    },
    updateReceipt: async function(req, res){
        try{
            apiHelper.preProcess(req,{
                mandatory:[], optional: ['comment', 'purchase_date', 'total_amount', 'merchant', 'postcode']
            },null);

            let receiptID = req.params.receiptID;
            logger.debug(`Prepare to update receipt with ID:${receiptID}, request: ${JSON.stringify(req.body)}`);

            let result = await receiptService.updateReceipt(receiptID, req.body);
            if(result == 1){
                let data = {
                    result: 'success',
                    message: 'Receipt info is updated successfully'
                };
                apiHelper.sendAPISuccess(req, res, data);
            }else{
                throw new InternalError("Failed to update receipt info", InternalError.Types.ServiceError);
            }
        }catch(e){
            apiHelper.sendAPIFailure(req, res, e);
        }
    }
}

module.exports = receiptAPI;
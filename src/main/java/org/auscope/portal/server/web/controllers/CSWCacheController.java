package org.auscope.portal.server.web.controllers;

import org.auscope.portal.csw.CSWRecord;
import org.auscope.portal.server.util.PortalPropertyPlaceholderConfigurer;
import org.auscope.portal.server.web.service.CSWCacheService;
import org.auscope.portal.server.web.view.ViewCSWRecordFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

/**
 * @version $Id$
 */
@Controller
public class CSWCacheController extends BaseCSWController {

    private CSWCacheService cswService;

    public CSWCacheController(ViewCSWRecordFactory viewCSWRecordFactory) {
        super(viewCSWRecordFactory);
    }

    /**
     * Constructor
     * @param
     */
    @Autowired
    public CSWCacheController(CSWCacheService cswService,
                         ViewCSWRecordFactory viewCSWRecordFactory,
                         PortalPropertyPlaceholderConfigurer propertyResolver) {

        super(viewCSWRecordFactory);
        this.cswService = cswService;

        try {
            cswService.updateRecordsInBackground();
        } catch (Exception e) {
            log.error(e);
        }
    }

    /**
     * This controller method returns a representation of each and every CSWRecord from the internal cache
     * @throws Exception
     */
    @RequestMapping("/getCSWRecords.do")
    public ModelAndView getCSWRecords() {
        try {
            this.cswService.updateRecordsInBackground();
        } catch (Exception ex) {
            log.error("Error updating cache", ex);
            return generateJSONResponseMAV(false, new CSWRecord[] {}, "Error updating cache");
        }

        CSWRecord[] records = null;
        try {
            records = this.cswService.getAllRecords();
        } catch (Exception e) {
            log.error("error getting data records", e);
            return generateJSONResponseMAV(false, new CSWRecord[] {}, "Error getting data records");
        }
        return generateJSONResponseMAV(records);
    }

    /**
     * This controller method is for forcing the internal cache of CSWRecords to invalidate and update.
     * @return
     */
    @RequestMapping("/updateCSWCache.do")
    public ModelAndView updateCSWCache() {
        try {
            this.cswService.updateRecordsInBackground(true);
            return generateJSONResponseMAV(true);
        } catch (Exception e) {
            log.warn("Error updating CSW cache", e);
            return generateJSONResponseMAV(false);
        }
    }
}
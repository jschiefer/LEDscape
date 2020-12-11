/**
 * Bump the priority of PRU request packets ggoing to the interconnect from 0 to 3
 * using the INIT_PRIORITY_0 register in the AM335x Control Module. See TRM 9.3.1.17.
 * We need a kernel module to do this becuase you can only write to the control module
 * from kernel mode. 
 *
 * Based on LKM code from http://derekmolloy.ie/writing-a-linux-kernel-module-part-1-introduction
*/

#include <linux/init.h>             // Macros used to mark up functions e.g., __init __exit
#include <linux/module.h>           // Core header for loading LKMs into the kernel
#include <linux/kernel.h>           // Contains types, macros, functions for the kernel

#include <asm/io.h>	// For iomem functions

MODULE_LICENSE("GPL");              ///< The license type -- this affects runtime behavior
MODULE_AUTHOR("Josh Levine");      ///< The author -- visible when you use modinfo
MODULE_DESCRIPTION("Set PRU interconnect priority to 3");
MODULE_VERSION("0.1");              ///< The version of the module

static char *name = "world";        ///< An example LKM argument -- default value is "world"
module_param(name, charp, S_IRUGO); ///< Param desc. charp = char ptr, S_IRUGO can be read/not changed
MODULE_PARM_DESC(name, "The name to display in /var/log/kern.log");  ///< parameter description

// Control Module Address

// Set P9_31 to PRU out. This is PRU reg 30 bit 0. 
const unsigned gpio_set =  0x44e10990 ;

const unsigned pru_init_priority =  0x44e10608;


/** @brief The LKM initialization function
 *  The static keyword restricts the visibility of the function to within this C file. The __init
 *  macro means that for a built-in driver (not a LKM) the function is only used at initialization
 *  time and that it can be discarded and its memory freed up after that point.
 *  @return returns 0 if successful
 */
static int __init helloBBB_init(void){
   void  * mem_addr;
   
   mem_addr = ioremap_nocache( pru_init_priority ,  4 );

   printk(KERN_INFO "PPB: Mapped %x to %p\n", pru_init_priority , mem_addr  );

   printk(KERN_INFO "PPB: Was %x\n",  ioread32( mem_addr ) );

   iowrite32( 0x03 << 4 , mem_addr );		// bits 5-4=PRU-ICSS initiator priority.

   printk(KERN_INFO "PPB: Is %x\n",  ioread32( mem_addr ) );

   iounmap(mem_addr);

   return 0;
}

/** @brief The LKM cleanup function
 *  Similar to the initialization function, it is static. The __exit macro notifies that if this
 *  code is used for a built-in driver (not a LKM) that this function is not required.
 */
static void __exit helloBBB_exit(void){
   printk(KERN_INFO "PPB: Goodbye %s from the PPB LKM!\n", name);
}

/** @brief A module must use the module_init() module_exit() macros from linux/init.h, which
 *  identify the initialization function at insertion time and the cleanup function (as
 *  listed above)
 */
module_init(helloBBB_init);
module_exit(helloBBB_exit);

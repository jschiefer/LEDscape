#include <linux/module.h>
#include <linux/vermagic.h>
#include <linux/compiler.h>

MODULE_INFO(vermagic, VERMAGIC_STRING);

struct module __this_module
__attribute__((section(".gnu.linkonce.this_module"))) = {
	.name = KBUILD_MODNAME,
	.init = init_module,
#ifdef CONFIG_MODULE_UNLOAD
	.exit = cleanup_module,
#endif
	.arch = MODULE_ARCH_INIT,
};

static const struct modversion_info ____versions[]
__used
__attribute__((section("__versions"))) = {
	{ 0xae4b0ceb, "module_layout" },
	{ 0x35b6b772, "param_ops_charp" },
	{ 0x2e5810c6, "__aeabi_unwind_cpp_pr1" },
	{ 0xefd6cf06, "__aeabi_unwind_cpp_pr0" },
	{ 0xac8f37b2, "outer_cache" },
	{ 0xc2165d85, "__arm_iounmap" },
	{ 0x27e1a049, "printk" },
	{ 0x40a6f522, "__arm_ioremap" },
};

static const char __module_depends[]
__used
__attribute__((section(".modinfo"))) =
"depends=";


MODULE_INFO(srcversion, "397E2282F096E3755FBA9C3");